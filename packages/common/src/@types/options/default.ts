import type { Format, Omit, Partial } from "ts-vista";

import type { CompleteOptions } from "#/@types/options/complete";
import type {
    CompleteBuildHandlerOptions,
    CompleteBuildPublicOptions,
    CompleteBuildServerOptions,
} from "#/@types/options/complete/build";
import type { CompleteDevOptions } from "#/@types/options/complete/dev";
import type { CompleteHttpsOptions } from "#/@types/options/complete/https";

/**
 * HTTPS server options.
 */
type HttpsOptions = Format<Partial<CompleteHttpsOptions>>;

/**
 * Public directory options.
 */
type BuildPublicOptions = Format<Partial<CompleteBuildPublicOptions>>;

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
    Partial<Omit<CompleteBuildServerOptions, "https" | "public">> & {
        /**
         * HTTPS server options.
         */
        https?: HttpsOptions;
        /**
         * Public directory options.
         */
        public?: BuildPublicOptions;
    }
>;

/**
 * Build handler options.
 */
type BuildHandlerOptions = Format<
    Pick<CompleteBuildHandlerOptions, "target"> &
        Partial<Omit<CompleteBuildHandlerOptions, "target" | "public">> & {
            /**
             * Public directory options.
             */
            public?: BuildPublicOptions;
        }
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
    BuildPublicOptions,
    BuildServerOptions,
    DevOptions,
    HttpsOptions,
    Options,
};
