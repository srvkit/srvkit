import type {
    PackageJson,
    ResolvedBuildOptions,
    ResolvedOptions,
} from "@srvkit/common";
import type { LoadResult, ResolveIdResult } from "rolldown";
import type { Plugin, UserConfig } from "vite";

import { builtinModules } from "node:module";

import { getPackageJson, toPosix } from "@srvkit/common";
import { toMerged } from "es-toolkit";

import { getSsrTarget } from "#/functions/ssr";
import { name } from "#/root/package.json";

const VIRTUAL_ENTRY = "virtual:srvkit" as const;

const VIRTUAL_ENTRY_RESOLVED = `\0${VIRTUAL_ENTRY}` as const;

const createVirtualEntryCode = (opts: ResolvedOptions): string => {
    const build: ResolvedBuildOptions = opts.build;

    let code: string = "";

    code += `import options from "${toPosix(opts.entry)}";`;
    code += `import { serve } from "@srvkit/vite/runtime";`;

    // handler export

    if (build.target === "handler") {
        code += `const server = serve({ ...options, manual: true });`;
        code += `export default server;`;

        return code;
    }

    // server export

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

const buildPlugin = (opts: ResolvedOptions): Plugin => {
    const build: ResolvedBuildOptions = opts.build;

    const packageJson: PackageJson = getPackageJson(opts.cwd);

    return {
        name: `${name}/build`,
        apply: "build",
        config: (config: UserConfig): UserConfig => {
            let result: UserConfig = {};

            let baseConfig: UserConfig = {
                resolve: {
                    conditions: [
                        opts.runtime,
                    ],
                },
                ssr: {
                    target: getSsrTarget(opts.runtime),
                    resolve: {
                        conditions: [
                            opts.runtime,
                        ],
                    },
                },
                build: {
                    copyPublicDir: false,
                },
            };

            if (build.bundle === "external") {
                baseConfig = {
                    ...baseConfig,
                    ssr: {
                        ...baseConfig,
                        external: true,
                        noExternal: void 0,
                    },
                };
            }

            if (build.bundle === "standalone") {
                baseConfig = {
                    ...baseConfig,
                    ssr: {
                        ...baseConfig,
                        external: void 0,
                        noExternal: true,
                    },
                };
            }

            result = toMerged(baseConfig, config);

            const overrideConfig: UserConfig = {
                build: {
                    ssr: true,
                    outDir: build.outputDir,
                    rolldownOptions: {
                        input: VIRTUAL_ENTRY,
                        output: {
                            entryFileNames: build.outputFile,
                            format:
                                packageJson.type === "module" ? "esm" : "cjs",
                        },
                        external: [
                            ...builtinModules,
                            /^node:/,
                        ],
                        experimental: {
                            attachDebugInfo: "none",
                        },
                    },
                    minify: build.minify,
                },
            };

            return toMerged(result, overrideConfig);
        },
        resolveId: (id: string): ResolveIdResult => {
            if (id !== VIRTUAL_ENTRY) return void 0;
            return VIRTUAL_ENTRY_RESOLVED;
        },
        load: async (id: string): Promise<LoadResult> => {
            if (id !== VIRTUAL_ENTRY_RESOLVED) return void 0;
            return createVirtualEntryCode(opts);
        },
    };
};

export { buildPlugin };
