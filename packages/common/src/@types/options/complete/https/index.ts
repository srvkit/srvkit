import type { ResolvableString } from "#/@types/env";

/**
 * Complete HTTPS server options.
 */
type CompleteHttpsOptions = {
    /**
     * File path or inlined TLS certificate in PEM format (required).
     */
    cert: ResolvableString;
    /**
     * File path or inlined TLS private key in PEM format (required).
     */
    key: ResolvableString;
    /**
     * Passphrase for the private key (optional).
     */
    passphrase: ResolvableString;
};

export type { CompleteHttpsOptions };
