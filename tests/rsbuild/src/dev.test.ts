import type {
    RsbuildDevServer,
    RsbuildInstance,
    StartDevServerResult,
} from "@rsbuild/core";
import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";

import type { FetchLocalResult } from "#/helpers/http";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { createRsbuild } from "@rsbuild/core";
import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { devPlugin } from "@srvkit/rsbuild/plugins/dev";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getSrcDir } from "#/helpers/fixture";
import { fetchLocal } from "#/helpers/http";
import { waitFor } from "#/helpers/wait";

const PORT: number = 3081;

const PORT_CUSTOM: number = 3082;

const PORT_HMR: number = 3083;

const PORT_HMR_MIDDLEWARE: number = 3084;

const PORT_HMR_ERROR: number = 3085;

const PORT_HMR_COMPILE_ERROR: number = 3086;

describe("rsbuild dev plugin", (): void => {
    let devServer: RsbuildDevServer;

    afterEach(async (): Promise<void> => {
        if (devServer !== void 0) {
            await devServer.close();

            devServer = void 0 as unknown as RsbuildDevServer;
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

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    devPlugin(opts),
                ],
                logLevel: "silent",
            },
        });

        const result: StartDevServerResult = await rsbuild.startDevServer({
            getPortSilently: true,
        });

        devServer = result.server;

        const response: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean => res.status === 200,
            {
                timeout: 5000,
                interval: 50,
            },
        );

        expect(response.status).toBe(200);
        expect(response.body).toContain("Hello from dev!");
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

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    devPlugin(opts),
                ],
                logLevel: "silent",
            },
        });

        const result: StartDevServerResult = await rsbuild.startDevServer({
            getPortSilently: true,
        });

        devServer = result.server;

        const response: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean => res.status === 200,
            {
                timeout: 5000,
                interval: 50,
            },
        );

        expect(response.status).toBe(200);
        expect(response.body).toContain("Custom port!");
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

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    devPlugin(opts),
                ],
                logLevel: "silent",
            },
        });

        const result: StartDevServerResult = await rsbuild.startDevServer({
            getPortSilently: true,
        });

        devServer = result.server;

        const response1: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean => res.status === 200,
            {
                timeout: 5000,
                interval: 50,
            },
        );

        expect(response1.status).toBe(200);
        expect(response1.body).toContain("Hello from dev!");

        Fs.writeFileSync(
            Path.resolve(getSrcDir(BASE_DIR, "dev-hmr"), "index.ts"),
            [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("Updated response!");',
                "    },",
                "};",
            ].join("\n"),
        );

        const response2: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean =>
                res.body.includes("Updated response!"),
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(response2.status).toBe(200);
        expect(response2.body).toContain("Updated response!");
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

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    devPlugin(opts),
                ],
                logLevel: "silent",
            },
        });

        const result: StartDevServerResult = await rsbuild.startDevServer({
            getPortSilently: true,
        });

        devServer = result.server;

        const response1: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean =>
                res.headers.get("x-mw-version") === "v1",
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(response1.status).toBe(200);
        expect(response1.headers.get("x-mw-version")).toBe("v1");

        Fs.writeFileSync(
            Path.resolve(getSrcDir(BASE_DIR, "dev-hmr-middleware"), "index.ts"),
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

        const response2: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean =>
                res.headers.get("x-mw-version") === "v2",
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(response2.status).toBe(200);
        expect(response2.headers.get("x-mw-version")).toBe("v2");
    }, 20000);

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

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    devPlugin(opts),
                ],
                logLevel: "silent",
            },
        });

        const result: StartDevServerResult = await rsbuild.startDevServer({
            getPortSilently: true,
        });

        devServer = result.server;

        const response1: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean => res.body.includes("err-v1"),
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(response1.status).toBe(500);
        expect(response1.body).toContain("err-v1");

        Fs.writeFileSync(
            Path.resolve(getSrcDir(BASE_DIR, "dev-hmr-error"), "index.ts"),
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

        const response2: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean => res.body.includes("err-v2"),
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(response2.status).toBe(500);
        expect(response2.body).toContain("err-v2");
    }, 20000);

    it("keeps old handler on compile error and resumes after fix", async (): Promise<void> => {
        const tempDir: string = createFixture(
            BASE_DIR,
            "dev-hmr-compile-error",
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
                port: PORT_HMR_COMPILE_ERROR,
            },
        });

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    devPlugin(opts),
                ],
                logLevel: "silent",
            },
        });

        const result: StartDevServerResult = await rsbuild.startDevServer({
            getPortSilently: true,
        });

        devServer = result.server;

        const response1: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean => res.status === 200,
            {
                timeout: 10000,
                interval: 50,
            },
        );

        expect(response1.status).toBe(200);
        expect(response1.body).toContain("stable handler");

        const entryPath: string = Path.resolve(
            getSrcDir(BASE_DIR, "dev-hmr-compile-error"),
            "index.ts",
        );

        // Broken syntax: recompile fails, dev plugin keeps old handler
        Fs.writeFileSync(
            entryPath,
            [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("never compiled"',
                "    },",
                "};",
            ].join("\n"),
        );

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const response2: FetchLocalResult = await fetchLocal({
            port: result.port,
        });

        expect(response2.status).toBe(200);
        expect(response2.body).toContain("stable handler");

        // Now fix the entry and confirm reload resumes
        Fs.writeFileSync(
            entryPath,
            [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("recovered handler");',
                "    },",
                "};",
            ].join("\n"),
        );

        const response3: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: result.port,
                }),
            (res: FetchLocalResult): boolean =>
                res.body.includes("recovered handler"),
            {
                timeout: 15000,
                interval: 50,
            },
        );

        expect(response3.status).toBe(200);
        expect(response3.body).toContain("recovered handler");
    }, 30000);

    afterAll((): void => {
        cleanupFixture(BASE_DIR, "dev-basic");
        cleanupFixture(BASE_DIR, "dev-port");
        cleanupFixture(BASE_DIR, "dev-hmr");
        cleanupFixture(BASE_DIR, "dev-hmr-middleware");
        cleanupFixture(BASE_DIR, "dev-hmr-error");
        cleanupFixture(BASE_DIR, "dev-hmr-compile-error");
    });
});
