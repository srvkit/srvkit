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
    host: string;
    /**
     * The port number for the development server.
     *
     * By default, it is `3001`.
     */
    port: number;
    /**
     * HTTPS server options.
     */
    https: CompleteHttpsOptions;
};

export type { CompleteDevOptions };
