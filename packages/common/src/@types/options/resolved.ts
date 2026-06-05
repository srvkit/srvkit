import type { Format, Omit } from "ts-vista";

import type { CompleteOptions } from "#/@types/options/complete";
import type {
    CompleteBuildHandlerOptions,
    CompleteBuildServerOptions,
} from "#/@types/options/complete/build";
import type { CompleteDevOptions } from "#/@types/options/complete/dev";
import type { HttpsOptions } from "#/@types/options/default";

/**
 * Resolved HTTPS server options.
 */
type ResolvedHttpsOptions = HttpsOptions;

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
 * Resolved default build server options.
 */
type ResolvedBuildServerOptions = Format<
    Omit<CompleteBuildServerOptions, "https"> & {
        /**
         * HTTPS server options.
         */
        https?: HttpsOptions;
    }
>;

/**
 * Resolved vercel build server options.
 */
type ResolvedBuildHandlerOptions = Format<CompleteBuildHandlerOptions>;

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
    ResolvedBuildServerOptions,
    ResolvedDevOptions,
    ResolvedHttpsOptions,
    ResolvedOptions,
};
