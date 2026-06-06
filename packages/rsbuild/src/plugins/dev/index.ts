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
    PackageJson,
    ResolvedBuildOptions,
    ResolvedDevOptions,
    ResolvedHttpsOptions,
    ResolvedOptions,
    Server,
    ServerHandler,
} from "@srvkit/common";

import { builtinModules } from "node:module";

import {
    getPackageJson,
    toHeaders,
    toPosix,
    writeHttpResponse,
} from "@srvkit/common";
import { toMerged } from "es-toolkit";

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

        const host: string = process.env.HOST ?? "localhost";

        const path: string = req.url ?? "";

        const url: URL = new URL(`${protocol}://${host}:${port}${path}`);

        const body: HTTP.IncomingMessage | undefined =
            req.method !== "GET" && req.method !== "HEAD" ? req : void 0;

        const request: Request = new Request(url, {
            method: req.method,
            headers: toHeaders(req.headers),
            // @ts-expect-error
            body,
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
    const dev: ResolvedDevOptions = opts.dev;
    const https: ResolvedHttpsOptions = dev.https ?? {};

    let code: string = "";

    code += `import options from "${toPosix(opts.entry)}";`;
    code += `import { serve } from "@srvkit/rsbuild/runtime";`;

    code += `const server = serve({`;
    code += `...options,`;
    code += `manual: true,`;
    code += `hostname: "${dev.host}",`;
    code += `port: ${dev.port},`;

    if (https.cert !== void 0)
        code += `tls: { cert: "${toPosix(https.cert)}" },`;
    if (https.key !== void 0) code += `tls: { key: "${toPosix(https.key)}" },`;
    if (https.passphrase !== void 0)
        code += `tls: { passphrase: "${toPosix(https.passphrase)}" },`;

    code += `});`;

    code += `export default server;`;

    return code;
};

const devPlugin = (opts: ResolvedOptions): RsbuildPlugin => {
    const dev: ResolvedDevOptions = opts.dev;
    const https: ResolvedHttpsOptions = opts.dev.https ?? {};
    const build: ResolvedBuildOptions = opts.build;

    const packageJson: PackageJson = getPackageJson(opts.cwd);

    return {
        name: "srvkit:dev",
        apply: "serve",
        async setup(api: RsbuildPluginAPI): Promise<void> {
            let srv: Server<ServerHandler> | undefined;

            const ssrTarget: Rspack.Target = getSsrTarget(opts.runtime);

            api.modifyRsbuildConfig((config: RsbuildConfig): RsbuildConfig => {
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
                        writeToDisk: true,
                    },
                    server: {
                        host: dev.host,
                        port: dev.port,
                        ...(https.cert !== void 0 && https.key !== void 0
                            ? {
                                  https: {
                                      cert: https.cert,
                                      key: https.key,
                                      passphrase: https.passphrase,
                                  },
                              }
                            : {}),
                    },
                };

                return toMerged(config, overrideConfig);
            });

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
                },
            );

            api.modifyRspackConfig(
                (config: Rspack.Configuration): Rspack.Configuration => {
                    const isModule: boolean = packageJson.type === "module";

                    const nodeExternals: (string | RegExp)[] = [
                        ...builtinModules,
                        /^node:/,
                    ];

                    config.output = {
                        ...config.output,
                        filename: build.outputFile,
                        ...(isModule
                            ? {
                                  module: true,
                              }
                            : {}),
                    };

                    config.target = ssrTarget;

                    config.node = {
                        ...config.node,
                        __dirname: false,
                        __filename: false,
                    };

                    if (Array.isArray(config.resolve?.conditionNames)) {
                        config.resolve.conditionNames.push(opts.runtime);
                    }

                    // bundle: external

                    if (build.bundle === "external") {
                        const depNames: string[] = [
                            ...Object.keys(packageJson.dependencies ?? {}),
                            ...Object.keys(packageJson.peerDependencies ?? {}),
                            ...Object.keys(
                                packageJson.optionalDependencies ?? {},
                            ),
                        ];

                        const depExternals: RegExp[] = depNames.map(
                            (depName: string): RegExp =>
                                new RegExp(`^${depName}(\\/|$)`),
                        );

                        config.externals = [
                            ...nodeExternals,
                            ...depExternals,
                        ];

                        config.externalsType = isModule
                            ? "module-import"
                            : "commonjs";
                    }

                    // bundle: standalone

                    if (build.bundle === "standalone") {
                        config.externals = nodeExternals;
                    }

                    return config;
                },
            );

            api.onAfterDevCompile(async ({ isFirstCompile }): Promise<void> => {
                if (!isFirstCompile) return void 0;

                const distPath: string = api.context.distPath;

                const outputUrl: string = `${toPosix(distPath).replace(/\/$/, "")}/index.js`;

                srv = (await import(outputUrl)).default;
            });

            api.onBeforeStartDevServer(({ server }): void => {
                const isHttps: boolean =
                    https.cert !== void 0 && https.key !== void 0;

                const port: number = server.port;

                server.middlewares.use(
                    async (
                        req: HTTP.IncomingMessage,
                        res: HTTP.ServerResponse,
                        next: () => void,
                    ): Promise<void> => {
                        if (srv === void 0) {
                            next();

                            return void 0;
                        }

                        const middleware: Middleware = createMiddleware({
                            server: srv,
                            isHttps,
                            port,
                        });

                        return middleware(req, res);
                    },
                );
            });
        },
    };
};

export { devPlugin };
