import type { RsbuildInstance } from "@rsbuild/core";
import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";

import { createRsbuild } from "@rsbuild/core";
import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { buildPlugin as buildPluginRsbuild } from "@srvkit/rsbuild/plugins/build";
import { buildPlugin as buildPluginVite } from "@srvkit/vite/plugins/build";
import { build } from "vite";
import { bench, describe } from "vitest";

describe("build", (): void => {
    bench("vite", async (): Promise<void> => {
        const opts: ResolvedOptions = resolveOptions({
            build: {
                target: "server",
                bundle: "standalone",
            },
        });

        await build({
            plugins: [
                buildPluginVite(opts),
            ],
            logLevel: "silent",
        });
    });

    bench("rsbuild", async (): Promise<void> => {
        const opts: ResolvedOptions = resolveOptions({
            build: {
                target: "server",
                bundle: "standalone",
            },
        });

        const rsbuild: RsbuildInstance = await createRsbuild({
            rsbuildConfig: {
                plugins: [
                    buildPluginRsbuild(opts),
                ],
                logLevel: "silent",
            },
        });

        await rsbuild.build();
    });
});
