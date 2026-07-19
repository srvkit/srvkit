import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";
import type { ViteDevServer } from "vite";

import type { FetchLocalResult } from "#/helpers/http";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";
import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { srvkit } from "@srvkit/vite/plugin";
import { cloudflareWorkersPreset } from "@srvkit/vite/presets";
import { createServer } from "vite";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getSrcDir } from "#/helpers/fixture";
import { fetchLocal } from "#/helpers/http";
import { waitFor } from "#/helpers/wait";

const PORT: number = 3099;

const WRANGLER_CONFIG: string = JSON.stringify({
    name: "dev-cf-hmr",
    compatibility_date: "2026-07-01",
    main: "src/index.ts",
});

describe("vite dev plugin with cloudflare", (): void => {
    let server: ViteDevServer;

    afterEach(async (): Promise<void> => {
        if (server !== void 0) {
            await server.close();

            server = void 0 as unknown as ViteDevServer;
        }
    });

    it("reloads handler on file change via import.meta.hot", async (): Promise<void> => {
        const tempDir: string = createFixture(BASE_DIR, "dev-cf-hmr", {
            entryContent: [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("Hello from cf dev!");',
                "    },",
                "};",
            ].join("\n"),
            extraFiles: {
                "wrangler.jsonc": WRANGLER_CONFIG,
            },
        });

        const opts: ResolvedOptions = resolveOptions(
            cloudflareWorkersPreset({
                cwd: tempDir,
                entry: "./src/index.ts",
                dev: {
                    port: PORT,
                },
            }),
        );

        server = await createServer({
            root: tempDir,
            plugins: [
                cloudflare(),
                ...srvkit(opts),
            ],
            server: {
                watch: {
                    usePolling: true,
                },
            },
            logLevel: "silent",
        });

        await server.listen();

        const result1: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: PORT,
                }),
            (res: FetchLocalResult): boolean =>
                res.status === 200 && res.body.includes("Hello from cf dev!"),
            {
                timeout: 30000,
                interval: 200,
            },
        );

        expect(result1.status).toBe(200);
        expect(result1.body).toContain("Hello from cf dev!");

        const entryPath: string = Path.resolve(
            getSrcDir(BASE_DIR, "dev-cf-hmr"),
            "index.ts",
        );

        Fs.writeFileSync(
            entryPath,
            [
                "export default {",
                "    fetch: (_req: Request): Response => {",
                '        return new Response("Updated cf response!");',
                "    },",
                "};",
            ].join("\n"),
        );

        server.watcher.emit("change", entryPath);

        const result2: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: PORT,
                }),
            (res: FetchLocalResult): boolean =>
                res.body.includes("Updated cf response!"),
            {
                timeout: 30000,
                interval: 200,
            },
        );

        expect(result2.status).toBe(200);
        expect(result2.body).toContain("Updated cf response!");
    }, 60000);

    it("reloads middleware on file change via update()", async (): Promise<void> => {
        const tempDir: string = createFixture(
            BASE_DIR,
            "dev-cf-hmr-middleware",
            {
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
                    '        return new Response("cf-mw-body");',
                    "    },",
                    "};",
                ].join("\n"),
                extraFiles: {
                    "wrangler.jsonc": WRANGLER_CONFIG,
                },
            },
        );

        const opts: ResolvedOptions = resolveOptions(
            cloudflareWorkersPreset({
                cwd: tempDir,
                entry: "./src/index.ts",
                dev: {
                    port: PORT,
                },
            }),
        );

        server = await createServer({
            root: tempDir,
            plugins: [
                cloudflare(),
                ...srvkit(opts),
            ],
            server: {
                watch: {
                    usePolling: true,
                },
            },
            logLevel: "silent",
        });

        await server.listen();

        const result1: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: PORT,
                }),
            (res: FetchLocalResult): boolean =>
                res.headers.get("x-mw-version") === "v1",
            {
                timeout: 30000,
                interval: 200,
            },
        );

        expect(result1.status).toBe(200);
        expect(result1.headers.get("x-mw-version")).toBe("v1");

        const entryPath: string = Path.resolve(
            getSrcDir(BASE_DIR, "dev-cf-hmr-middleware"),
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
                '        return new Response("cf-mw-body");',
                "    },",
                "};",
            ].join("\n"),
        );

        server.watcher.emit("change", entryPath);

        const result2: FetchLocalResult = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: PORT,
                }),
            (res: FetchLocalResult): boolean =>
                res.headers.get("x-mw-version") === "v2",
            {
                timeout: 30000,
                interval: 200,
            },
        );

        expect(result2.status).toBe(200);
        expect(result2.headers.get("x-mw-version")).toBe("v2");
    }, 60000);

    afterAll((): void => {
        cleanupFixture(BASE_DIR, "dev-cf-hmr");
        cleanupFixture(BASE_DIR, "dev-cf-hmr-middleware");
    });
});
