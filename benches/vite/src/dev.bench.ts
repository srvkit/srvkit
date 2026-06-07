import type { ResolvedOptions } from "@srvkit/common";
import type { ViteDevServer } from "vite";

import * as Path from "node:path";

import { resolveOptions } from "@srvkit/common";
import { devPlugin } from "@srvkit/vite/plugins/dev";
import { createServer } from "vite";
import { bench, describe } from "vitest";

const DIR_APP: string = Path.resolve(
    import.meta.dirname,
    Path.join("..", "..", "app"),
);

const PORT: number = 3101;

describe("vite dev", (): void => {
    bench("startup", async (): Promise<void> => {
        const opts: ResolvedOptions = resolveOptions({
            cwd: DIR_APP,
            entry: "./src/index.ts",
            dev: {
                port: PORT,
            },
        });

        const server: ViteDevServer = await createServer({
            root: DIR_APP,
            plugins: [
                devPlugin(opts),
            ],
            logLevel: "silent",
        });

        await server.listen();

        await server.close();
    });
});
