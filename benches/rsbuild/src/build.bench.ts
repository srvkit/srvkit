import type { RsbuildInstance } from "@rsbuild/core";
import type { ResolvedOptions } from "@srvkit/common";

import * as Fsp from "node:fs/promises";
import * as Path from "node:path";

import { createRsbuild } from "@rsbuild/core";
import { resolveOptions } from "@srvkit/common";
import { buildPlugin } from "@srvkit/rsbuild/plugins/build";
import { afterAll, bench, describe } from "vitest";

const DIR_APP: string = Path.resolve(
    import.meta.dirname,
    Path.join("..", "..", "app"),
);

const DIR_DIST: string = Path.resolve(
    import.meta.dirname,
    Path.join("..", "..", "app", "dist"),
);

describe("rsbuild build", (): void => {
    afterAll(async (): Promise<void> => {
        await Fsp.rm(DIR_DIST, {
            recursive: true,
            force: true,
        });
    });

    bench("build", async (): Promise<void> => {
        await Fsp.rm(DIR_DIST, {
            recursive: true,
            force: true,
        });

        const opts: ResolvedOptions = resolveOptions({
            cwd: DIR_APP,
            entry: "./src/index.ts",
            build: {
                target: "server",
                bundle: "standalone",
                outputDir: DIR_DIST,
            },
        });

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: DIR_APP,
            rsbuildConfig: {
                plugins: [
                    buildPlugin(opts),
                ],
                logLevel: "silent",
            },
        });

        await rsbuild.build();
    });
});
