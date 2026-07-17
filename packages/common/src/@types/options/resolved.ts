import type { Format, Omit, Partial } from "ts-vista";

import type { CompleteOptions } from "#/@types/options/complete";
import type {
    CompleteBuildHandlerOptions,
    CompleteBuildPublicOptions,
    CompleteBuildServerOptions,
} from "#/@types/options/complete/build";
import type { CompleteDevOptions } from "#/@types/options/complete/dev";
import type { HttpsOptions } from "#/@types/options/default";

/**
 * Resolved HTTPS server options.
 */
type ResolvedHttpsOptions = HttpsOptions;

/**
 * Resolved public directory options.
 */
type ResolvedBuildPublicOptions = Format<
    Partial<CompleteBuildPublicOptions, "to">
>;

/**
 * Resolved development server options.
 */
type ResolvedDevOptions = Format<
    Omit<CompleteDevOptions, "https"> & {
        /**
         * HTTPS server options.
         */
        https?: HttpsOptions;
    }
>;

/**
 * Resolved build server options.
 */
type ResolvedBuildServerOptions = Format<
    Omit<CompleteBuildServerOptions, "https" | "public"> & {
        /**
         * HTTPS server options.
         */
        https?: HttpsOptions;
        /**
         * Public directory options.
         */
        public: ResolvedBuildPublicOptions;
    }
>;

/**
 * Resolved build handler options.
 */
type ResolvedBuildHandlerOptions = Format<
    Omit<CompleteBuildHandlerOptions, "public"> & {
        /**
         * Public directory options.
         */
        public: ResolvedBuildPublicOptions;
    }
>;

/**
 * Resolved build options.
 */
type ResolvedBuildOptions =
    | ResolvedBuildServerOptions
    | ResolvedBuildHandlerOptions;

/**
 * Resolved options.
 */
type ResolvedOptions = Format<
    Omit<CompleteOptions, "dev" | "build"> & {
        /**
         * Development server options.
         */
        dev: ResolvedDevOptions;
        /**
         * Build server options.
         */
        build: ResolvedBuildOptions;
    }
>;

export type {
    ResolvedBuildHandlerOptions,
    ResolvedBuildOptions,
    ResolvedBuildPublicOptions,
    ResolvedBuildServerOptions,
    ResolvedDevOptions,
    ResolvedHttpsOptions,
    ResolvedOptions,
};
