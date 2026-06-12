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

export type { CompleteHttpsOptions };
