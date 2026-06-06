import type {
    ResolvedBuildOptions,
    ResolvedOptions,
} from "#/@types/options/resolved";

import { toPosix } from "#/functions/path/posix";

type VirtualEntryOptions = ResolvedOptions & {
    packageName: string;
};

const createVirtualEntryCode = (opts: VirtualEntryOptions): string => {
    const build: ResolvedBuildOptions = opts.build;

    let code: string = "";

    code += `import options from "${toPosix(opts.entry)}";`;
    code += `import { serve } from "${opts.packageName}/runtime";`;

    if (build.target === "handler") {
        code += `const server = serve({ ...options, manual: true });`;
        code += `export default server;`;

        return code;
    }

    code += `serve({`;
    code += `...options,`;

    if (build.host !== "localhost") code += `hostname: "${build.host}",`;
    if (build.port !== 3000) code += `port: ${build.port},`;

    if (build.https) {
        code += `tls: {`;
        if (build.https.cert) code += `cert: "${toPosix(build.https.cert)}",`;
        if (build.https.key) code += `key: "${toPosix(build.https.key)}",`;
        if (build.https.passphrase)
            code += `passphrase: "${toPosix(build.https.passphrase)}",`;
        code += `},`;
    }

    code += `});`;

    return code;
};

export type { VirtualEntryOptions };
export { createVirtualEntryCode };
