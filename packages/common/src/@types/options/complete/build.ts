import type { ResolvableNumber, ResolvableString } from "#/@types/env";
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

/**
 * Public directory options.
 */
type CompleteBuildPublicOptions = {
    /**
     * Whether to copy the public directory to the output directory.
     *
     * When this is `true`, the public directory will be copied
     * into the directory with same name inside the output directory.
     *
     * By default, it is `false`.
     */
    copy: boolean;
    /**
     * The source public directory path.
     *
     * By default, it is `./public`.
     */
    from: string;
    /**
     * The destination directory for the public directory
     * inside the output directory.
     *
     * By default, it is the value from `from` option.
     */
    to: string;
};

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
    /**
     * Public directory options.
     */
    public: CompleteBuildPublicOptions;
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
    host: ResolvableString;
    /**
     * The port number for the production server.
     *
     * By default, it is `3000`.
     */
    port: ResolvableNumber;
    /**
     * HTTPS server options.
     */
    https: CompleteHttpsOptions;
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
    CompleteBuildPublicOptions,
    CompleteBuildServerOptions,
};
