import type { ResolvableString } from "#/@types/env";
import type {
    ResolvedBuildOptions,
    ResolvedOptions,
} from "#/@types/options/resolved";

import { injectNumber, injectString } from "#/functions/env/inject";
import { BUILD_SERVER_FALLBACKS } from "#/functions/options/resolve";
import { toPosix } from "#/functions/path/posix";

type VirtualEntryOptions = ResolvedOptions & {
    packageName: string;
};

const createVirtualEntryCode = (opts: VirtualEntryOptions): string => {
    const build: ResolvedBuildOptions = opts.build;

    let code: string = "";

    code += `import options from "${toPosix(opts.entry)}";`;
    code += `import { serve } from "${opts.packageName}/runtime";`;

    // Handler targets run on platforms that manage their own server lifecycle,
    // add `manual: true` prevents serve() from auto-listening
    if (build.target === "handler") {
        code += `const server = serve({ ...options, manual: true });`;
        code += `export default server;`;

        return code;
    }

    code += `serve({`;
    code += `...options,`;

    if (build.host !== BUILD_SERVER_FALLBACKS.host) {
        code += `hostname: ${injectString(build.host, BUILD_SERVER_FALLBACKS.host)},`;
    }
    if (build.port !== BUILD_SERVER_FALLBACKS.port) {
        code += `port: ${injectNumber(build.port, BUILD_SERVER_FALLBACKS.port)},`;
    }

    if (build.https) {
        const cert: ResolvableString | undefined = build.https.cert;
        const key: ResolvableString | undefined = build.https.key;
        const passphrase: ResolvableString | undefined = build.https.passphrase;

        code += `tls: {`;
        if (cert !== void 0)
            code += `cert: ${injectString(typeof cert === "string" ? toPosix(cert) : cert)},`;
        if (key !== void 0)
            code += `key: ${injectString(typeof key === "string" ? toPosix(key) : key)},`;
        if (passphrase !== void 0)
            code += `passphrase: ${injectString(passphrase)},`;
        code += `},`;
    }

    code += `});`;

    return code;
};

export type { VirtualEntryOptions };
export { createVirtualEntryCode };
