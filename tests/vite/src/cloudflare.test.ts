import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";
import type { Plugin, UserConfig } from "vite";

import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { buildPlugin } from "@srvkit/vite/plugins/build";
import { devPlugin } from "@srvkit/vite/plugins/dev";
import { createServer } from "vite";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture } from "#/helpers/fixture";

const CLOUDFLARE_PLUGIN_FAKE: Plugin = {
    name: "vite-plugin-cloudflare:virtual-modules",
};

const configWithCloudflare = (): UserConfig => ({
    plugins: [
        CLOUDFLARE_PLUGIN_FAKE,
    ],
});

const configWithoutCloudflare = (): UserConfig => ({
    plugins: [
        {
            name: "some-other-plugin",
        },
    ],
});

const resolveHandlerOptions = (cwd: string): ResolvedOptions =>
    resolveOptions({
        cwd,
        entry: "./src/index.ts",
        build: {
            target: "handler",
        },
    });

const resolveServerOptions = (cwd: string): ResolvedOptions =>
    resolveOptions({
        cwd,
        entry: "./src/index.ts",
        build: {
            target: "server",
        },
    });

describe("cloudflare cooperation", (): void => {
    let tempDir: string;

    beforeAll((): void => {
        tempDir = createFixture(BASE_DIR, "cloudflare-coop");
    });

    afterAll((): void => {
        cleanupFixture(BASE_DIR, "cloudflare-coop");
    });

    describe("devPlugin", (): void => {
        let server: import("vite").ViteDevServer;

        afterEach(async (): Promise<void> => {
            if (server !== undefined) {
                await server.close();

                server = void 0 as unknown as import("vite").ViteDevServer;
            }
        });

        it("redirects virtual:cloudflare/user-entry to srvkit entry when CF plugin is present", (): void => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [prePlugin, basePlugin] = devPlugin(opts) as [
                Plugin & {
                    resolveId: (id: string) => unknown;
                },
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            basePlugin.config(configWithCloudflare());

            const result = prePlugin.resolveId("virtual:cloudflare/user-entry");

            expect(result).toBe("\0virtual:srvkit");
        });

        it("does not redirect virtual:cloudflare/user-entry when CF plugin is absent", (): void => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [prePlugin, basePlugin] = devPlugin(opts) as [
                Plugin & {
                    resolveId: (id: string) => unknown;
                },
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            basePlugin.config(configWithoutCloudflare());

            const result = prePlugin.resolveId("virtual:cloudflare/user-entry");

            expect(result).toBeUndefined();
        });

        it("resolves virtual:srvkit regardless of CF presence", (): void => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [prePlugin, basePlugin] = devPlugin(opts) as [
                Plugin & {
                    resolveId: (id: string) => unknown;
                },
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            basePlugin.config(configWithCloudflare());

            expect(prePlugin.resolveId("virtual:srvkit")).toBe(
                "\0virtual:srvkit",
            );

            basePlugin.config(configWithoutCloudflare());

            expect(prePlugin.resolveId("virtual:srvkit")).toBe(
                "\0virtual:srvkit",
            );
        });

        it("loads dev virtual entry code with createLiveServer when CF plugin is present", async (): Promise<void> => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [prePlugin, basePlugin] = devPlugin({
                ...opts,
                runtime: "workerd",
            }) as [
                Plugin & {
                    load: (id: string) => Promise<unknown>;
                },
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            basePlugin.config(configWithCloudflare());

            const code = (await prePlugin.load("\0virtual:srvkit")) as string;

            expect(code).toContain("import { createLiveServer } from");
            expect(code).toContain("gracefulShutdown: false");
            expect(code).toContain("manual: true");
            expect(code).toContain("export default server");
            expect(code).toContain("import.meta.hot.accept");
        });

        it("self-disables configureServer when CF plugin is present", async (): Promise<void> => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const plugins = devPlugin({
                ...opts,
                dev: {
                    port: 3094,
                },
            });

            const [, basePlugin] = plugins as [
                Plugin,
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            const config = basePlugin.config(configWithCloudflare());

            expect(config.build?.rolldownOptions?.input).toBeUndefined();

            server = await createServer({
                root: tempDir,
                plugins: [
                    ...plugins,
                    CLOUDFLARE_PLUGIN_FAKE,
                ],
                logLevel: "silent",
            });

            await server.listen();

            const middlewareStack: unknown = (
                server as unknown as {
                    middlewares: {
                        stack: unknown[];
                    };
                }
            ).middlewares.stack;

            const srvkitMiddlewarePresent: boolean = middlewareStack.some(
                (fn: unknown): boolean => {
                    if (typeof fn !== "function") return false;
                    return (
                        (
                            fn as {
                                name?: string;
                            }
                        ).name?.includes("createMiddleware") === true
                    );
                },
            );

            expect(srvkitMiddlewarePresent).toBe(false);
        }, 15000);
    });

    describe("buildPlugin", (): void => {
        it("redirects virtual:cloudflare/user-entry to srvkit entry when CF plugin is present and target is handler", (): void => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [prePlugin, basePlugin] = buildPlugin(opts) as [
                Plugin & {
                    resolveId: (id: string) => unknown;
                },
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            basePlugin.config(configWithCloudflare());

            const result = prePlugin.resolveId("virtual:cloudflare/user-entry");

            expect(result).toBe("\0virtual:srvkit");
        });

        it("does not redirect when Cloudflare plugin is absent", (): void => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [prePlugin, basePlugin] = buildPlugin(opts) as [
                Plugin & {
                    resolveId: (id: string) => unknown;
                },
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            basePlugin.config(configWithoutCloudflare());

            const result = prePlugin.resolveId("virtual:cloudflare/user-entry");

            expect(result).toBeUndefined();
        });

        it("also redirects virtual:cloudflare/user-entry for server target", (): void => {
            const opts: ResolvedOptions = resolveServerOptions(tempDir);

            const [prePlugin, basePlugin] = buildPlugin(opts) as [
                Plugin & {
                    resolveId: (id: string) => unknown;
                },
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            basePlugin.config(configWithCloudflare());

            const result = prePlugin.resolveId("virtual:cloudflare/user-entry");

            expect(result).toBe("\0virtual:srvkit");
        });

        it("still resolves virtual:srvkit regardless of CF presence", (): void => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [prePlugin, basePlugin] = buildPlugin(opts) as [
                Plugin & {
                    resolveId: (id: string) => unknown;
                },
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            basePlugin.config(configWithCloudflare());

            expect(prePlugin.resolveId("virtual:srvkit")).toBe(
                "\0virtual:srvkit",
            );

            basePlugin.config(configWithoutCloudflare());

            expect(prePlugin.resolveId("virtual:srvkit")).toBe(
                "\0virtual:srvkit",
            );
        });

        it("does not set top-level build input when CF plugin is present", (): void => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [, basePlugin] = buildPlugin(opts) as [
                Plugin,
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            const result = basePlugin.config(
                configWithCloudflare(),
            ) as UserConfig;

            const input = result.build?.rolldownOptions?.input;

            expect(input).toBeUndefined();
        });

        it("sets top-level build input when CF plugin is absent", (): void => {
            const opts: ResolvedOptions = resolveHandlerOptions(tempDir);

            const [, basePlugin] = buildPlugin(opts) as [
                Plugin,
                Plugin & {
                    config: (config: UserConfig) => UserConfig;
                },
            ];

            const result = basePlugin.config(
                configWithoutCloudflare(),
            ) as UserConfig;

            const input = result.build?.rolldownOptions?.input;

            expect(input).toBe("virtual:srvkit");
        });
    });
});
