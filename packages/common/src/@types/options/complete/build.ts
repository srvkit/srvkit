import type { CompleteHttpsOptions } from "#/@types/options/complete/https";

/**
 * Build target.
 *
 * #### `server`
 *
 * Produces a self-starting server.
 *
 * It outputs `serve({ ... })` directly.
 *
 * #### `handler`
 *
 * Produces a handler for serverless platforms.
 *
 * It outputs `export default serve({ ... })` since the platform manages those.
 */
type BuildTarget = "server" | "handler";

/**
 * Bundle mode.
 *
 * - `external` - keeps all dependencies external.
 * - `standalone` - bundles all dependencies into the output file.
 */
type BundleMode = "external" | "standalone";

type CompleteBuildBaseOptions<T extends BuildTarget> = {
    /**
     * Build target.
     *
     * By default, it is `server`.
     */
    target: T;
    /**
     * Whether to bundle all dependencies into the output file.
     *
     * By default, it is `external`.
     */
    bundle: BundleMode;
    /**
     * The output directory for the application.
     *
     * By default, it is `./dist`.
     */
    outputDir: string;
    /**
     * The output file name for the application.
     *
     * By default, it is `index.js`.
     */
    outputFile: string;
    /**
     * Whether to minify the output.
     *
     * By default, it is `false`.
     */
    minify: boolean;
};

/**
 * Complete default build server options.
 */
type CompleteBuildServerOptions = CompleteBuildBaseOptions<"server"> & {
    /**
     * The host for the production server.
     *
     * By default, it is `localhost`.
     */
    host: string;
    /**
     * The port number for the production server.
     *
     * By default, it is `3000`.
     */
    port: number;
    /**
     * HTTPS server options.
     */
    https: CompleteHttpsOptions;
    /**
     * The public directory for the application.
     *
     * By default, it is `./public`.
     */
    publicDir: string;
    /**
     * Whether to copy the public directory to the output directory.
     *
     * When this is `true`, the public directory will be copied
     * into the directory with same name inside the output directory.
     *
     * By default, it is `false`.
     */
    copyPublicDir: boolean;
};

/**
 * Complete build handler options.
 */
type CompleteBuildHandlerOptions = CompleteBuildBaseOptions<"handler">;

/**
 * Complete build server options.
 */
type CompleteBuildOptions =
    | CompleteBuildServerOptions
    | CompleteBuildHandlerOptions;

export type {
    BuildTarget,
    BundleMode,
    CompleteBuildBaseOptions,
    CompleteBuildHandlerOptions,
    CompleteBuildOptions,
    CompleteBuildServerOptions,
};
