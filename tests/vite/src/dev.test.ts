import type { ResolvedOptions } from "@srvkit/common";
import type { ViteDevServer } from "vite";

import { resolveOptions } from "@srvkit/common";
import { devPlugin } from "@srvkit/vite/plugins/dev";
import { createServer } from "vite";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { cleanupFixture, createFixture } from "./helpers/fixture";
import { fetchLocal } from "./helpers/http";

const BASE_DIR: string = process.cwd();

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
            logLevel: "silent",
            plugins: [
                devPlugin(opts),
            ],
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
            logLevel: "silent",
            plugins: [
                devPlugin(opts),
            ],
        });

        await server.listen();

        const result = await fetchLocal({
            port: PORT_CUSTOM,
        });

        expect(result.status).toBe(200);

        expect(result.body).toContain("Custom port!");
    }, 60000);

    // TODO: Add HMR test once the dev plugin supports live reloading of the server.

    afterAll((): void => {
        cleanupFixture(BASE_DIR, "dev-basic");
        cleanupFixture(BASE_DIR, "dev-port");
    });
});
