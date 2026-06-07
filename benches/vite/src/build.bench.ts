import type { ResolvedOptions } from "@srvkit/common";

import * as Fsp from "node:fs/promises";
import * as Path from "node:path";

import { resolveOptions } from "@srvkit/common";
import { buildPlugin } from "@srvkit/vite/plugins/build";
import { build } from "vite";
import { afterAll, bench, describe } from "vitest";

const DIR_APP: string = Path.resolve(
    import.meta.dirname,
    Path.join("..", "..", "app"),
);

const DIR_DIST: string = Path.resolve(
    import.meta.dirname,
    Path.join("..", "..", "app", "dist"),
);

describe("vite build", (): void => {
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

        await build({
            root: DIR_APP,
            plugins: [
                buildPlugin(opts),
            ],
            logLevel: "silent",
        });
    });
});
