import type HTTP from "node:http";

import type {
    ResolvedDevOptions,
    ResolvedHttpsOptions,
    ResolvedOptions,
} from "@srvkit/common/@types/options/resolved";
import type { Server, ServerOptions } from "@srvkit/common/@types/server";
import type {
    Connect,
    DevEnvironment,
    EnvironmentModuleNode,
    Plugin,
    UserConfig,
    ViteDevServer,
} from "vite";

import { OPTIONS_DEV } from "@srvkit/common/consts/options";
import { createVirtualEntryCode } from "@srvkit/common/functions/build/virtual-entry";
import {
    resolveNumber,
    resolveString,
} from "@srvkit/common/functions/env/resolve";
import { toHeaders } from "@srvkit/common/functions/http/request/header";
import { writeHttpResponse } from "@srvkit/common/functions/http/response/write";
import { createLiveServer } from "@srvkit/common/functions/server/live";
import { mergeConfig } from "vite";

import {
    CLOUDFLARE_USER_ENTRY,
    VIRTUAL_ENTRY,
    VIRTUAL_ENTRY_RESOLVED,
} from "#/consts/name";
import { hasCloudflarePlugin } from "#/functions/cloudflare";
import { getSsrTarget } from "#/functions/ssr";
import { name } from "#/root/package.json";

type CreateMiddlewareOptions = {
    vite: ViteDevServer;
    server: Server;
};

const createMiddleware = ({ vite, server }: CreateMiddlewareOptions) => {
    return async (
        req: Connect.IncomingMessage,
        res: HTTP.ServerResponse,
    ): Promise<void> => {
        const isHttps: boolean =
            vite.config.server.https?.cert !== void 0 &&
            vite.config.server.https?.key !== void 0;

        const protocol: string = `http${isHttps ? "s" : ""}`;

        const serverHost: string | boolean | undefined =
            vite.config.server.host;

        // Vite uses `true` as shorthand for "listen on all interfaces" (0.0.0.0)
        const host: string =
            typeof serverHost === "boolean"
                ? "0.0.0.0"
                : typeof serverHost === "string"
                  ? serverHost
                  : "localhost";

        const port: number = vite.config.server.port;

        const path: string = req.url ?? "";

        const url: URL = new URL(`${protocol}://${host}:${port}${path}`);

        // GET and HEAD requests must not have a body per HTTP spec
        const body: Connect.IncomingMessage | undefined =
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

const devPlugin = (opts: ResolvedOptions): Plugin[] => {
    const dev: ResolvedDevOptions = opts.dev;
    const https: ResolvedHttpsOptions = opts.dev.https ?? {};

    const resolvedHost: string = resolveString(dev.host, OPTIONS_DEV.host);
    const resolvedPort: number = resolveNumber(dev.port, OPTIONS_DEV.port);
    const resolvedCert: string | undefined = resolveString(https.cert);
    const resolvedKey: string | undefined = resolveString(https.key);
    const resolvedPassphrase: string | undefined = resolveString(
        https.passphrase,
    );

    /**
     * Detect if Cloudflare Vite plugin is present, then disable srvkit's
     * middleware to avoid double-handling requests, and redirect Cloudflare's
     * virtual user entry to srvkit's one.
     */
    let isCloudflare: boolean = false;

    const prePlugin: Plugin = {
        name: `${name}/dev-pre`,
        // Ensure the redirection of `virtual:cloudflare/user-entry`.
        enforce: "pre",
        apply: "serve",
        resolveId(id: string) {
            if (id === VIRTUAL_ENTRY) return VIRTUAL_ENTRY_RESOLVED;

            // Cloudflare environment
            if (isCloudflare && id === CLOUDFLARE_USER_ENTRY) {
                return VIRTUAL_ENTRY_RESOLVED;
            }

            return void 0;
        },
        async load(id: string) {
            if (id !== VIRTUAL_ENTRY_RESOLVED) return void 0;

            return createVirtualEntryCode({
                dev: true,
                isCloudflare,
                packageName: name,
                resolvedOptions: opts,
            });
        },
    };

    const basePlugin: Plugin = {
        name: `${name}/dev`,
        apply: "serve",
        config(config: UserConfig): UserConfig {
            isCloudflare = hasCloudflarePlugin(config);

            const devConfig: UserConfig = {
                resolve: {
                    conditions: [
                        opts.runtime,
                    ],
                },
                ssr: {
                    target: getSsrTarget(opts.runtime),
                    resolve: {
                        conditions: [
                            opts.runtime,
                        ],
                    },
                },
                build: {
                    ssr: true,
                    rolldownOptions: {
                        // Avoid client build pollution on Cloudflare environment
                        ...(isCloudflare
                            ? {}
                            : {
                                  input: VIRTUAL_ENTRY,
                              }),
                    },
                },
                server: {
                    host: resolvedHost,
                    port: resolvedPort,
                    ...(resolvedCert !== void 0 && resolvedKey !== void 0
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

            return mergeConfig(config, devConfig);
        },
        configureServer: async (vite: ViteDevServer): Promise<void> => {
            // Cloudflare plugin handles HTTP routing and module loading itself
            if (isCloudflare) return void 0;

            const serverOptions: ServerOptions = (
                await vite.ssrLoadModule(opts.entry)
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

            const middleware: Middleware = createMiddleware({
                vite,
                server,
            });

            vite.middlewares.use(middleware);

            // Live update

            let reloadTimer: ReturnType<typeof setTimeout> | undefined = void 0;

            // Retry up to 3 times with backoff because the module graph
            // may not be fully invalidated on the first attempt
            const reload = async (attempt: number): Promise<void> => {
                try {
                    const ssrEnv: DevEnvironment = vite.environments.ssr;

                    const mod: EnvironmentModuleNode =
                        await ssrEnv.moduleGraph.ensureEntryFromUrl(opts.entry);

                    ssrEnv.moduleGraph.invalidateModule(mod);

                    const newServerOptions: ServerOptions = (
                        await vite.ssrLoadModule(opts.entry)
                    ).default;

                    update(newServerOptions);
                } catch {
                    if (attempt < 3) {
                        setTimeout(
                            (): void => {
                                reload(attempt + 1);
                            },
                            (attempt + 1) * 100,
                        );
                    }
                }
            };

            // Debounce rapid file changes to avoid redundant reloads
            vite.watcher.on("change", (): void => {
                clearTimeout(reloadTimer);

                reloadTimer = setTimeout((): void => {
                    reload(0);
                }, 100);
            });
        },
    };

    return [
        prePlugin,
        basePlugin,
    ];
};

export { devPlugin };
