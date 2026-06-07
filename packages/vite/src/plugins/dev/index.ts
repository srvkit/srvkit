import type HTTP from "node:http";

import type {
    ResolvedDevOptions,
    ResolvedHttpsOptions,
    ResolvedOptions,
    Server,
    ServerOptions,
} from "@srvkit/common";
import type { Connect, Plugin, UserConfig, ViteDevServer } from "vite";

import { createLiveServer, toHeaders, writeHttpResponse } from "@srvkit/common";
import { toMerged } from "es-toolkit";

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

        const host: string = process.env.HOST ?? "localhost";

        const port: number = vite.config.server.port;

        const path: string = req.url ?? "";

        const url: URL = new URL(`${protocol}://${host}:${port}${path}`);

        const body: Connect.IncomingMessage | undefined =
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

const devPlugin = (opts: ResolvedOptions): Plugin => {
    const dev: ResolvedDevOptions = opts.dev;
    const https: ResolvedHttpsOptions = opts.dev.https ?? {};

    return {
        name: `${name}/dev`,
        apply: "serve",
        config(config: UserConfig): UserConfig {
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
                    rollupOptions: {
                        input: opts.entry,
                    },
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

            return toMerged(config, devConfig);
        },
        configureServer: async (vite: ViteDevServer): Promise<void> => {
            const serverOptions: ServerOptions = (
                await vite.ssrLoadModule(opts.entry)
            ).default;

            const { server, update } = createLiveServer({
                // base
                gracefulShutdown: false,
                // user
                ...serverOptions,
                // override
                manual: true,
                hostname: dev.host,
                port: dev.port,
                tls: {
                    cert: https.cert,
                    key: https.key,
                    passphrase: https.passphrase,
                },
            });

            const middleware: Middleware = createMiddleware({
                vite,
                server,
            });

            vite.middlewares.use(middleware);

            // Live update

            let reloadTimer: ReturnType<typeof setTimeout> | undefined = void 0;

            vite.watcher.on("change", (): void => {
                clearTimeout(reloadTimer);

                reloadTimer = setTimeout(async (): Promise<void> => {
                    try {
                        const newServerOptions: ServerOptions = (
                            await vite.ssrLoadModule(opts.entry)
                        ).default;

                        update(newServerOptions);
                    } catch {
                        // Keep old handler running on error
                    }
                }, 100);
            });
        },
    };
};

export { devPlugin };
