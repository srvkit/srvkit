import type { RsbuildInstance, StartDevServerResult } from "@rsbuild/core";
import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";
import type { ViteDevServer } from "vite";

import { createRsbuild } from "@rsbuild/core";
import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { devPlugin as devPluginRsbuild } from "@srvkit/rsbuild/plugins/dev";
import { devPlugin as devPluginVite } from "@srvkit/vite/plugins/dev";
import { createServer } from "vite";
import { bench, describe } from "vitest";

describe("dev", (): void => {
    bench("vite", async (): Promise<void> => {
        const PORT: number = 3101;

        const opts: ResolvedOptions = resolveOptions({
            dev: {
                port: PORT,
            },
        });

        const server: ViteDevServer = await createServer({
            plugins: [
                devPluginVite(opts),
            ],
            build: {
                emptyOutDir: true,
            },
            logLevel: "silent",
        });

        await server.listen();

        await server.close();
    });

    bench("rsbuild", async (): Promise<void> => {
        const PORT: number = 3201;

        const opts: ResolvedOptions = resolveOptions({
            dev: {
                port: PORT,
            },
        });

        const rsbuild: RsbuildInstance = await createRsbuild({
            rsbuildConfig: {
                plugins: [
                    devPluginRsbuild(opts),
                ],
                output: {
                    cleanDistPath: {
                        enable: true,
                    },
                },
                logLevel: "silent",
            },
        });

        const result: StartDevServerResult = await rsbuild.startDevServer({
            getPortSilently: true,
        });

        await result.server.close();
    });
});
