import type { ResolvableString } from "#/@types/env";
import type {
    ResolvedBuildOptions,
    ResolvedOptions,
} from "#/@types/options/resolved";

import { OPTIONS_BUILD_SERVER_BASE } from "#/consts/options";
import { injectNumber, injectString } from "#/functions/env/inject";
import { toPosix } from "#/functions/path/posix";

type VirtualEntryOptions = ResolvedOptions & {
    packageName: string;
};

const createVirtualEntryCode = (opts: VirtualEntryOptions): string => {
    const build: ResolvedBuildOptions = opts.build;

    let code: string = "";

    // Inject the env import for Cloudflare Workers
    if (opts.runtime === "workerd")
        code += `import { env } from "cloudflare:workers";`;

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

    if (build.host !== OPTIONS_BUILD_SERVER_BASE.host) {
        code += `hostname: ${injectString(opts.runtime, build.host, OPTIONS_BUILD_SERVER_BASE.host)},`;
    }
    if (build.port !== OPTIONS_BUILD_SERVER_BASE.port) {
        code += `port: ${injectNumber(opts.runtime, build.port, OPTIONS_BUILD_SERVER_BASE.port)},`;
    }

    if (build.https) {
        const cert: ResolvableString | undefined = build.https.cert;
        const key: ResolvableString | undefined = build.https.key;
        const passphrase: ResolvableString | undefined = build.https.passphrase;

        code += `tls: {`;
        if (cert !== void 0)
            code += `cert: ${injectString(opts.runtime, typeof cert === "string" ? toPosix(cert) : cert)},`;
        if (key !== void 0)
            code += `key: ${injectString(opts.runtime, typeof key === "string" ? toPosix(key) : key)},`;
        if (passphrase !== void 0)
            code += `passphrase: ${injectString(opts.runtime, passphrase)},`;
        code += `},`;
    }

    code += `});`;

    return code;
};

export type { VirtualEntryOptions };
export { createVirtualEntryCode };
