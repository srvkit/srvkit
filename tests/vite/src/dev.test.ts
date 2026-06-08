import type { ResolvedOptions } from "@srvkit/common";
import type { ViteDevServer } from "vite";

import type { FetchLocalResult } from "#/helpers/http";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { resolveOptions } from "@srvkit/common";
import { devPlugin } from "@srvkit/vite/plugins/dev";
import { createServer } from "vite";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getSrcDir } from "#/helpers/fixture";
import { fetchLocal } from "#/helpers/http";
import { waitFor } from "#/helpers/wait";

const PORT: number = 3091;

const PORT_CUSTOM: number = 3092;

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
    }, 60000);

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
    }, 60000);

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
                port: 3093,
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
                    interval: 100,
                },
            },
            logLevel: "silent",
        });

        await server.listen();

        const result1 = await fetchLocal({
            port: 3093,
        });

        expect(result1.status).toBe(200);
        expect(result1.body).toContain("Hello from dev!");

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

        const result2 = await waitFor(
            (): Promise<FetchLocalResult> =>
                fetchLocal({
                    port: 3093,
                }),
            (res): boolean => res.body.includes("Updated response!"),
            {
                timeout: 10000,
                interval: 500,
            },
        );

        expect(result2.status).toBe(200);
        expect(result2.body).toContain("Updated response!");
    }, 60000);

    afterAll((): void => {
        cleanupFixture(BASE_DIR, "dev-basic");
        cleanupFixture(BASE_DIR, "dev-port");
        cleanupFixture(BASE_DIR, "dev-hmr");
    });
});
