import type {
    ResolvedBuildOptions,
    ResolvedOptions,
} from "@srvkit/common/@types/options/resolved";
import type { PackageJson } from "@srvkit/common/functions/package/package-json";
import type { LoadResult, ResolveIdResult } from "rolldown";
import type { Plugin, UserConfig } from "vite";

import { builtinModules } from "node:module";

import { createVirtualEntryCode } from "@srvkit/common/functions/build/virtual-entry";
import { getPackageJson } from "@srvkit/common/functions/package/package-json";
import { mergeConfig } from "vite";

import { getSsrTarget } from "#/functions/ssr";
import { name } from "#/root/package.json";

const VIRTUAL_ENTRY = "virtual:srvkit" as const;

const VIRTUAL_ENTRY_RESOLVED = `\0${VIRTUAL_ENTRY}` as const;

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
                        ...baseConfig.ssr,
                        external: true,
                        noExternal: void 0,
                    },
                };
            }

            if (build.bundle === "standalone") {
                baseConfig = {
                    ...baseConfig,
                    ssr: {
                        ...baseConfig.ssr,
                        external: void 0,
                        noExternal: true,
                    },
                };
            }

            result = mergeConfig(baseConfig, config);

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

            return mergeConfig(result, overrideConfig);
        },
        resolveId: (id: string): ResolveIdResult => {
            if (id !== VIRTUAL_ENTRY) return void 0;
            return VIRTUAL_ENTRY_RESOLVED;
        },
        load: async (id: string): Promise<LoadResult> => {
            if (id !== VIRTUAL_ENTRY_RESOLVED) return void 0;
            return createVirtualEntryCode({
                ...opts,
                packageName: name,
            });
        },
    };
};

export { buildPlugin };
