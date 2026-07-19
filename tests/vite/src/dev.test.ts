import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";
import type { ViteDevServer } from "vite";

import type { FetchLocalResult } from "#/helpers/http";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { devPlugin } from "@srvkit/vite/plugins/dev";
import { createServer } from "vite";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getSrcDir } from "#/helpers/fixture";
import { fetchLocal } from "#/helpers/http";
import { waitFor } from "#/helpers/wait";

const PORT: number = 3091;

const PORT_CUSTOM: number = 3092;

const PORT_HMR: number = 3093;

const PORT_HMR_MIDDLEWARE: number = 3095;

const PORT_HMR_ERROR: number = 3096;

const PORT_HMR_ERROR_RECOVERY: number = 3097;

const PORT_HMR_DEBOUNCE: number = 3098;

describe("vite dev plugin", (): void => {
    let server: ViteDevServer;

    afterEach(async (): Promise<void> => {
        if (server !== void 0) {
            await server.close();

            server = void 0 as unknown as ViteDevServer;
        }
    });

    it("starts dev server and responds to requests", async (): Promise<void> => {
        const tempDir: string = createFixture(BASE_DIR, "dev-basic", {
            entryContent: [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("Hello from dev!");',
                "    },",
                "};",
            ].join("\n"),
        });

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            dev: {
                port: PORT,
            },
        });

        server = await createServer({
            root: tempDir,
            plugins: [
                devPlugin(opts),
            ],
            logLevel: "silent",
        });

        await server.listen();

        const result = await fetchLocal({
            port: PORT,
        });

        expect(result.status).toBe(200);

        expect(result.body).toContain("Hello from dev!");
    }, 15000);

    it("starts dev server on custom port", async (): Promise<void> => {
        const tempDir: string = createFixture(BASE_DIR, "dev-port", {
            entryContent: [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("Custom port!");',
                "    },",
                "};",
            ].join("\n"),
        });

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            dev: {
                port: PORT_CUSTOM,
            },
        });

        server = await createServer({
            root: tempDir,
            plugins: [
                devPlugin(opts),
            ],
            logLevel: "silent",
        });

        await server.listen();

        const result = await fetchLocal({
            port: PORT_CUSTOM,
        });

        expect(result.status).toBe(200);

        expect(result.body).toContain("Custom port!");
    }, 15000);

    it("reloads handler on file change", async (): Promise<void> => {
        const tempDir: string = createFixture(BASE_DIR, "dev-hmr", {
            entryContent: [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("Hello from dev!");',
                "    },",
                "};",
            ].join("\n"),
        });

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            dev: {
                port: PORT_HMR,
            },
        });

        server = await createServer({
            root: tempDir,
            plugins: [
                devPlugin(opts),
            ],
            server: {
                watch: {
                    usePolling: true,
                },
            },
            logLevel: "silent",
        });

        await server.listen();

        const result1 = await fetchLocal({
            port: PORT_HMR,
        });

        expect(result1.status).toBe(200);
        expect(result1.body).toContain("Hello from dev!");

        const entryPath: string = Path.resolve(
            getSrcDir(BASE_DIR, "dev-hmr"),
            "index.ts",
        );

        Fs.writeFileSync(
            entryPath,
            [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("Updated response!");',
                "    },",
                "};",
            ].join("\n"),
        );

        server.watcher.emit("change", entryPath);

        const result2 = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: PORT_HMR,
                }),
            (res): boolean => res.body.includes("Updated response!"),
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(result2.status).toBe(200);
        expect(result2.body).toContain("Updated response!");
    }, 15000);

    it("reloads middleware on file change", async (): Promise<void> => {
        const tempDir: string = createFixture(BASE_DIR, "dev-hmr-middleware", {
            entryContent: [
                "export default {",
                "    middleware: [",
                "        (_req: Request, next: () => Response): Response => {",
                "            const res = next();",
                "            return new Response(res.body, {",
                "                status: res.status,",
                '                headers: { "x-mw-version": "v1" },',
                "            });",
                "        },",
                "    ],",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("mw-body");',
                "    },",
                "};",
            ].join("\n"),
        });

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            dev: {
                port: PORT_HMR_MIDDLEWARE,
            },
        });

        server = await createServer({
            root: tempDir,
            plugins: [
                devPlugin(opts),
            ],
            server: {
                watch: {
                    usePolling: true,
                },
            },
            logLevel: "silent",
        });

        await server.listen();

        const result1 = await fetchLocal({
            port: PORT_HMR_MIDDLEWARE,
        });

        expect(result1.status).toBe(200);
        expect(result1.headers.get("x-mw-version")).toBe("v1");

        const entryPath: string = Path.resolve(
            getSrcDir(BASE_DIR, "dev-hmr-middleware"),
            "index.ts",
        );

        Fs.writeFileSync(
            entryPath,
            [
                "export default {",
                "    middleware: [",
                "        (_req: Request, next: () => Response): Response => {",
                "            const res = next();",
                "            return new Response(res.body, {",
                "                status: res.status,",
                '                headers: { "x-mw-version": "v2" },',
                "            });",
                "        },",
                "    ],",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("mw-body");',
                "    },",
                "};",
            ].join("\n"),
        );

        server.watcher.emit("change", entryPath);

        const result2 = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: PORT_HMR_MIDDLEWARE,
                }),
            (res): boolean => res.headers.get("x-mw-version") === "v2",
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(result2.status).toBe(200);
        expect(result2.headers.get("x-mw-version")).toBe("v2");
    }, 15000);

    it("reloads error handler on file change", async (): Promise<void> => {
        const tempDir: string = createFixture(BASE_DIR, "dev-hmr-error", {
            entryContent: [
                "export default {",
                "    fetch: (): Response => {",
                '        throw new Error("boom");',
                "    },",
                "    error: (_err: unknown): Response => {",
                '        return new Response("err-v1", { status: 500 });',
                "    },",
                "};",
            ].join("\n"),
        });

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            dev: {
                port: PORT_HMR_ERROR,
            },
        });

        server = await createServer({
            root: tempDir,
            plugins: [
                devPlugin(opts),
            ],
            server: {
                watch: {
                    usePolling: true,
                },
            },
            logLevel: "silent",
        });

        await server.listen();

        const result1 = await fetchLocal({
            port: PORT_HMR_ERROR,
        });

        expect(result1.status).toBe(500);
        expect(result1.body).toContain("err-v1");

        const entryPath: string = Path.resolve(
            getSrcDir(BASE_DIR, "dev-hmr-error"),
            "index.ts",
        );

        Fs.writeFileSync(
            entryPath,
            [
                "export default {",
                "    fetch: (): Response => {",
                '        throw new Error("boom");',
                "    },",
                "    error: (_err: unknown): Response => {",
                '        return new Response("err-v2", { status: 500 });',
                "    },",
                "};",
            ].join("\n"),
        );

        server.watcher.emit("change", entryPath);

        const result2 = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: PORT_HMR_ERROR,
                }),
            (res): boolean => res.body.includes("err-v2"),
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(result2.status).toBe(500);
        expect(result2.body).toContain("err-v2");
    }, 15000);

    it("keeps old handler when reload source throws", async (): Promise<void> => {
        const tempDir: string = createFixture(
            BASE_DIR,
            "dev-hmr-error-recovery",
            {
                entryContent: [
                    "export default {",
                    "    fetch: (_req: Request): Response => {",
                    '        return new Response("stable handler");',
                    "    },",
                    "};",
                ].join("\n"),
            },
        );

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            dev: {
                port: PORT_HMR_ERROR_RECOVERY,
            },
        });

        server = await createServer({
            root: tempDir,
            plugins: [
                devPlugin(opts),
            ],
            server: {
                watch: {
                    usePolling: true,
                },
            },
            logLevel: "silent",
        });

        await server.listen();

        const result1 = await fetchLocal({
            port: PORT_HMR_ERROR_RECOVERY,
        });

        expect(result1.status).toBe(200);
        expect(result1.body).toContain("stable handler");

        const entryPath: string = Path.resolve(
            getSrcDir(BASE_DIR, "dev-hmr-error-recovery"),
            "index.ts",
        );

        // Broken entry: ssrLoadModule will throw on reload
        Fs.writeFileSync(
            entryPath,
            [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("never loaded",',
                "    },",
                "};",
            ].join("\n"),
        );

        server.watcher.emit("change", entryPath);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const result2 = await fetchLocal({
            port: PORT_HMR_ERROR_RECOVERY,
        });

        expect(result2.status).toBe(200);
        expect(result2.body).toContain("stable handler");
    }, 15000);

    it("debounces rapid file changes", async (): Promise<void> => {
        const tempDir: string = createFixture(BASE_DIR, "dev-hmr-debounce", {
            entryContent: [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("initial v0");',
                "    },",
                "};",
            ].join("\n"),
        });

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            dev: {
                port: PORT_HMR_DEBOUNCE,
            },
        });

        server = await createServer({
            root: tempDir,
            plugins: [
                devPlugin(opts),
            ],
            server: {
                watch: {
                    usePolling: true,
                },
            },
            logLevel: "silent",
        });

        await server.listen();

        const result1 = await fetchLocal({
            port: PORT_HMR_DEBOUNCE,
        });

        expect(result1.status).toBe(200);
        expect(result1.body).toContain("initial v0");

        const entryPath: string = Path.resolve(
            getSrcDir(BASE_DIR, "dev-hmr-debounce"),
            "index.ts",
        );

        // Emit three rapid changes within the 100ms debounce window.
        // Only the final content should be served after reload settles.
        for (const i of [
            1,
            2,
            3,
        ]) {
            Fs.writeFileSync(
                entryPath,
                [
                    "export default {",
                    "    fetch: (_req: Request): Response => {",
                    `        return new Response("rapid v${i}");`,
                    "    },",
                    "};",
                ].join("\n"),
            );
            server.watcher.emit("change", entryPath);
        }

        const result2 = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: PORT_HMR_DEBOUNCE,
                }),
            (res): boolean => res.body.includes("rapid v3"),
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(result2.status).toBe(200);
        expect(result2.body).toContain("rapid v3");
    }, 15000);

    afterAll((): void => {
        cleanupFixture(BASE_DIR, "dev-basic");
        cleanupFixture(BASE_DIR, "dev-port");
        cleanupFixture(BASE_DIR, "dev-hmr");
        cleanupFixture(BASE_DIR, "dev-hmr-middleware");
        cleanupFixture(BASE_DIR, "dev-hmr-error");
        cleanupFixture(BASE_DIR, "dev-hmr-error-recovery");
        cleanupFixture(BASE_DIR, "dev-hmr-debounce");
    });
});
