import type { Format, Omit, Partial } from "ts-vista";

import type { CompleteOptions } from "#/@types/options/complete";
import type {
    CompleteBuildHandlerOptions,
    CompleteBuildServerOptions,
} from "#/@types/options/complete/build";
import type {
    CompleteDevOptions,
    CompleteHttpsOptions,
} from "#/@types/options/complete/dev";

/**
 * HTTPS server options.
 */
type HttpsOptions = Format<Partial<CompleteHttpsOptions>>;

/**
 * Development server options.
 */
type DevOptions = Format<
    Partial<Omit<CompleteDevOptions, "https">> & {
        /**
         * HTTPS server options.
         */
        https?: HttpsOptions;
    }
>;

/**
 * Build server options.
 */
type BuildServerOptions = Format<
    Partial<Omit<CompleteBuildServerOptions, "https">> & {
        /**
         * HTTPS server options.
         */
        https?: HttpsOptions;
    }
>;

/**
 * Build handler options.
 */
type BuildHandlerOptions = Format<
    Pick<CompleteBuildHandlerOptions, "target"> &
        Partial<Omit<CompleteBuildHandlerOptions, "target">>
>;

/**
 * Build options.
 */
type BuildOptions = BuildServerOptions | BuildHandlerOptions;

/**
 * Options for the plugin.
 */
type Options = Format<
    Partial<Omit<CompleteOptions, "dev" | "build">> & {
        /**
         * The options for the development server.
         */
        dev?: DevOptions;
        /**
         * The options for the production server.
         */
        build?: BuildOptions;
    }
>;

export type {
    BuildHandlerOptions,
    BuildOptions,
    BuildServerOptions,
    DevOptions,
    HttpsOptions,
    Options,
};
