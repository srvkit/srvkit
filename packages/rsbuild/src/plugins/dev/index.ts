import type HTTP from "node:http";

import type {
    ModifyBundlerChainUtils,
    RsbuildConfig,
    RsbuildPlugin,
    RsbuildPluginAPI,
    Rspack,
    RspackChain,
} from "@rsbuild/core";
import type {
    ResolvedBuildOptions,
    ResolvedDevOptions,
    ResolvedHttpsOptions,
    ResolvedOptions,
} from "@srvkit/common/@types/options/resolved";
import type { Server, ServerOptions } from "@srvkit/common/@types/server";
import type { PackageJson } from "@srvkit/common/functions/package/package-json";

import * as Fsp from "node:fs/promises";
import { builtinModules } from "node:module";
import * as Path from "node:path";
import { pathToFileURL } from "node:url";

import {
    resolveNumber,
    resolveString,
} from "@srvkit/common/functions/env/resolve";
import { toHeaders } from "@srvkit/common/functions/http/request/header";
import { writeHttpResponse } from "@srvkit/common/functions/http/response/write";
import { DEV_FALLBACKS } from "@srvkit/common/functions/options/resolve";
import { getPackageJson } from "@srvkit/common/functions/package/package-json";
import { toPosix } from "@srvkit/common/functions/path/posix";
import { createLiveServer } from "@srvkit/common/functions/server/live";

import { VIRTUAL_ENTRY } from "#/constants/path";
import { getSsrTarget } from "#/functions/ssr";

type CreateMiddlewareOptions = {
    server: Server;
    isHttps: boolean;
    port: number;
};

const createMiddleware = ({
    server,
    isHttps,
    port,
}: CreateMiddlewareOptions) => {
    return async (
        req: HTTP.IncomingMessage,
        res: HTTP.ServerResponse,
    ): Promise<void> => {
        const protocol: string = `http${isHttps ? "s" : ""}`;

        const host: string = server.options.hostname ?? "localhost";

        const path: string = req.url ?? "";

        const url: URL = new URL(`${protocol}://${host}:${port}${path}`);

        // GET and HEAD requests must not have a body per HTTP spec
        const body: HTTP.IncomingMessage | undefined =
            req.method !== "GET" && req.method !== "HEAD" ? req : void 0;

        const request: Request = new Request(url, {
            method: req.method,
            headers: toHeaders(req.headers),
            // @ts-expect-error
            body,
            // Required for streaming request bodies in Node's fetch implementation
            duplex: "half",
        });

        const response: Response = await server.fetch(request);

        await writeHttpResponse({
            response,
            httpResponse: res,
        });
    };
};

type Middleware = ReturnType<typeof createMiddleware>;

const createDevVirtualEntryCode = (opts: ResolvedOptions): string => {
    let code: string = "";

    code += `import options from "${toPosix(opts.entry)}";`;
    code += `export default options;`;

    return code;
};

const devPlugin = (opts: ResolvedOptions): RsbuildPlugin => {
    const dev: ResolvedDevOptions = opts.dev;
    const https: ResolvedHttpsOptions = opts.dev.https ?? {};
    const build: ResolvedBuildOptions = opts.build;

    const resolvedHost: string = resolveString(dev.host, DEV_FALLBACKS.host);
    const resolvedPort: number = resolveNumber(dev.port, DEV_FALLBACKS.port);
    const resolvedCert: string | undefined = resolveString(https.cert);
    const resolvedKey: string | undefined = resolveString(https.key);
    const resolvedPassphrase: string | undefined = resolveString(
        https.passphrase,
    );

    const isHttps: boolean = resolvedCert !== void 0 && resolvedKey !== void 0;

    const packageJson: PackageJson = getPackageJson(opts.cwd);

    return {
        name: "srvkit:dev",
        apply: "serve",
        async setup(api: RsbuildPluginAPI): Promise<void> {
            let middleware: Middleware | undefined;

            let liveUpdate: ((options: ServerOptions) => void) | undefined;

            let port: number;

            let compileCount: number = 0;

            const isModule: boolean = packageJson.type === "module";

            const ssrTarget: Rspack.Target = getSsrTarget(opts.runtime);

            const externals: (string | RegExp)[] = [
                ...builtinModules,
                /^cloudflare:/,
            ];

            if (build.bundle === "external") {
                const depNames: string[] = [
                    ...Object.keys(packageJson.dependencies ?? {}),
                    ...Object.keys(packageJson.peerDependencies ?? {}),
                    ...Object.keys(packageJson.optionalDependencies ?? {}),
                ];

                const depExternals: RegExp[] = depNames.map(
                    (depName: string): RegExp =>
                        new RegExp(
                            `^${depName.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}([\\/]|$)`,
                        ),
                );

                externals.push(...depExternals);
            }

            api.modifyRsbuildConfig(
                (
                    config: RsbuildConfig,
                    { mergeRsbuildConfig },
                ): RsbuildConfig => {
                    const overrideConfig: RsbuildConfig = {
                        source: {
                            entry: {
                                index: VIRTUAL_ENTRY,
                            },
                        },
                        output: {
                            target: "node",
                            distPath: build.outputDir,
                            copy: void 0,
                        },
                        dev: {
                            // Live reload imports the compiled file from disk,
                            // so it must be written out
                            writeToDisk: true,
                        },
                        server: {
                            host: resolvedHost,
                            port: resolvedPort,
                            ...(resolvedCert !== void 0 &&
                            resolvedKey !== void 0
                                ? {
                                      https: {
                                          cert: resolvedCert,
                                          key: resolvedKey,
                                          passphrase: resolvedPassphrase,
                                      },
                                  }
                                : {}),
                        },
                    };

                    return mergeRsbuildConfig(config, overrideConfig);
                },
            );

            api.modifyBundlerChain(
                (
                    chain: RspackChain,
                    { rspack }: ModifyBundlerChainUtils,
                ): void => {
                    // Add support for virtual modules
                    chain
                        .plugin("virtual-modules")
                        .use(rspack.experiments.VirtualModulesPlugin, [
                            {
                                [VIRTUAL_ENTRY]:
                                    createDevVirtualEntryCode(opts),
                            },
                        ]);

                    // When `target` is `webworker`, all modules will be bundled.
                    // Therefore, this plugin is used to make them external again.
                    if (opts.runtime === "workerd") {
                        chain
                            .plugin("workerd-externals")
                            .use(rspack.ExternalsPlugin, [
                                isModule ? "module-import" : "commonjs",
                                externals,
                            ]);
                    }
                },
            );

            api.modifyRspackConfig(
                (config, { mergeConfig }): Rspack.Configuration => {
                    const overrideConfig: Rspack.Configuration = {
                        resolve: {
                            /** @see https://rspack.rs/config/resolve#extend-default-value */
                            conditionNames: [
                                opts.runtime,
                                "...", // Default values
                            ],
                        },
                        output: {
                            filename: build.outputFile,
                            ...(isModule
                                ? {
                                      module: true,
                                  }
                                : {}),
                        },
                        target: ssrTarget,
                        externals,
                        externalsType: isModule ? "module-import" : "commonjs",
                        // Preserve real __dirname/__filename values instead of injecting
                        // Rspack polyfills — server code should use the real Node values
                        node: {
                            __dirname: false,
                            __filename: false,
                        },
                    };

                    return mergeConfig(config, overrideConfig);
                },
            );

            api.onAfterDevCompile(async ({ isFirstCompile }): Promise<void> => {
                const distPath: string = api.context.distPath;

                const outputPath: string = Path.resolve(distPath, "index.js");

                compileCount++;

                // Initial compile

                if (isFirstCompile) {
                    const serverOptions: ServerOptions = (
                        await import(pathToFileURL(outputPath).href)
                    ).default;

                    const { server, update } = createLiveServer({
                        // Prevent srvx from installing its own SIGTERM handler
                        gracefulShutdown: false,
                        ...serverOptions,
                        // Defer server start so middleware can be attached first
                        manual: true,
                        hostname: resolvedHost,
                        port: resolvedPort,
                        tls: {
                            cert: resolvedCert,
                            key: resolvedKey,
                            passphrase: resolvedPassphrase,
                        },
                    });

                    liveUpdate = update;

                    middleware = createMiddleware({
                        server,
                        isHttps,
                        port,
                    });

                    return void 0;
                }

                // Live update

                try {
                    // Node caches imports by URL — using a unique path forces re-import each time
                    const importPath: string = Path.resolve(
                        distPath,
                        `index-${compileCount}.js`,
                    );

                    await Fsp.copyFile(outputPath, importPath);

                    const newServerOptions: ServerOptions = (
                        await import(pathToFileURL(importPath).href)
                    ).default;

                    // Remove the temp copy after import to avoid accumulating stale files
                    await Fsp.unlink(importPath);

                    liveUpdate?.(newServerOptions);
                } catch {
                    // Keep old handler running on error

                    try {
                        await Fsp.unlink(
                            Path.resolve(distPath, `index-${compileCount}.js`),
                        );
                    } catch {
                        // Unlink may fail if the import itself threw — file may not exist
                    }
                }
            });

            api.onBeforeStartDevServer(({ server }): void => {
                port = server.port;

                server.middlewares.use(
                    async (
                        req: HTTP.IncomingMessage,
                        res: HTTP.ServerResponse,
                        next: () => void,
                    ): Promise<void> => {
                        // Middleware may not be ready before the first compile completes
                        if (middleware === void 0) {
                            next();

                            return void 0;
                        }

                        return middleware(req, res);
                    },
                );
            });
        },
    };
};

export { devPlugin };
