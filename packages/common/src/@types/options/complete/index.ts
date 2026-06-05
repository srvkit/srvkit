import type { CompleteBuildOptions } from "#/@types/options/complete/build";
import type { CompleteDevOptions } from "#/@types/options/complete/dev";

/**
 * Runtime target for the application.
 *
 * - Node.js - `node`
 * - Deno - `deno`
 * - Bun - `bun`
 * - Cloudflare Workers - `workerd`
 */
type Runtime = "node" | "deno" | "bun" | "workerd";

/**
 * Complete options for the plugin.
 */
type CompleteOptions = {
    /**
     * The current working directory.
     *
     * By default, it is `process.cwd()`.
     */
    cwd: string;
    /**
     * Runtime target for the application.
     *
     * By default, it is `node`.
     */
    runtime: Runtime;
    /**
     * The entry file for the application.
     *
     * By default, it is `./src/index.ts` or `./src/index.js`.
     */
    entry: string;
    /**
     * The options for the development server.
     */
    dev: CompleteDevOptions;
    /**
     * The options for the production server.
     */
    build: CompleteBuildOptions;
    /**
     * Whether to output log messages to the console.
     *
     * By default, it is `false`.
     */
    verbose: boolean;
};

export type { CompleteOptions, Runtime };
