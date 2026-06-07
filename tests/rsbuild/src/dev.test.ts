import type {
    RsbuildDevServer,
    RsbuildInstance,
    StartDevServerResult,
} from "@rsbuild/core";
import type { ResolvedOptions } from "@srvkit/common";

import type { FetchLocalResult } from "#/helpers/http";

import { createRsbuild } from "@rsbuild/core";
import { resolveOptions } from "@srvkit/common";
import { devPlugin } from "@srvkit/rsbuild/plugins/dev";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture } from "#/helpers/fixture";
import { fetchLocal } from "#/helpers/http";
import { waitFor } from "#/helpers/wait";

const PORT: number = 3081;

const PORT_CUSTOM: number = 3082;

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
                timeout: 10000,
                interval: 500,
            },
        );

        expect(response.status).toBe(200);
        expect(response.body).toContain("Hello from dev!");
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
                timeout: 10000,
                interval: 500,
            },
        );

        expect(response.status).toBe(200);
        expect(response.body).toContain("Custom port!");
    }, 60000);

    // TODO: Add HMR test once the dev plugin supports live reloading of the server.

    afterAll((): void => {
        cleanupFixture(BASE_DIR, "dev-basic");
        cleanupFixture(BASE_DIR, "dev-port");
    });
});
