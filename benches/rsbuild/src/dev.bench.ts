import type { RsbuildInstance, StartDevServerResult } from "@rsbuild/core";
import type { ResolvedOptions } from "@srvkit/common";

import * as Fsp from "node:fs/promises";
import * as Path from "node:path";

import { createRsbuild } from "@rsbuild/core";
import { resolveOptions } from "@srvkit/common";
import { devPlugin } from "@srvkit/rsbuild/plugins/dev";
import { afterAll, bench, describe } from "vitest";

const DIR_APP: string = Path.resolve(
    import.meta.dirname,
    Path.join("..", "..", "app"),
);

const DIR_DIST: string = Path.resolve(
    import.meta.dirname,
    Path.join("..", "..", "app", "dist"),
);

describe("rsbuild dev", (): void => {
    afterAll(async (): Promise<void> => {
        await Fsp.rm(DIR_DIST, {
            recursive: true,
            force: true,
        });
    });

    bench("startup", async (): Promise<void> => {
        await Fsp.rm(DIR_DIST, {
            recursive: true,
            force: true,
        });

        const opts: ResolvedOptions = resolveOptions({
            cwd: DIR_APP,
            entry: "./src/index.ts",
        });

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: DIR_APP,
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

        await result.server.close();
    });
});
