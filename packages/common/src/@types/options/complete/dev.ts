import type { ResolvableNumber, ResolvableString } from "#/@types/env";
import type { CompleteHttpsOptions } from "#/@types/options/complete/https";

/**
 * Complete development server options.
 */
type CompleteDevOptions = {
    /**
     * The host for the development server.
     *
     * By default, it is `localhost`.
     */
    host: ResolvableString;
    /**
     * The port number for the development server.
     *
     * By default, it is `3001`.
     */
    port: ResolvableNumber;
    /**
     * HTTPS server options.
     */
    https: CompleteHttpsOptions;
};

export type { CompleteDevOptions };
