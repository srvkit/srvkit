/**
 * Complete HTTPS server options.
 */
type CompleteHttpsOptions = {
    /**
     * File path or inlined TLS certificate in PEM format (required).
     */
    cert: string;
    /**
     * File path or inlined TLS private key in PEM format (required).
     */
    key: string;
    /**
     * Passphrase for the private key (optional).
     */
    passphrase: string;
};

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

export type { CompleteDevOptions, CompleteHttpsOptions };
