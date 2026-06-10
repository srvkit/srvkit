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

import { toHeaders } from "@srvkit/common/functions/http/request/header";
import { writeHttpResponse } from "@srvkit/common/functions/http/response/write";
import { createLiveServer } from "@srvkit/common/functions/server/live";
import { mergeConfig } from "vite";

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

            return mergeConfig(config, devConfig);
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

            vite.watcher.on("change", (): void => {
                clearTimeout(reloadTimer);

                reloadTimer = setTimeout((): void => {
                    reload(0);
                }, 100);
            });
        },
    };
};

export { devPlugin };
