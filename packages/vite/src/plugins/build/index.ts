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

import {
    CLOUDFLARE_USER_ENTRY,
    VIRTUAL_ENTRY,
    VIRTUAL_ENTRY_RESOLVED,
} from "#/consts/name";
import { hasCloudflarePlugin } from "#/functions/cloudflare";
import { getSsrTarget } from "#/functions/ssr";
import { name } from "#/root/package.json";

const buildPlugin = (opts: ResolvedOptions): Plugin[] => {
    const build: ResolvedBuildOptions = opts.build;

    const packageJson: PackageJson = getPackageJson(opts.cwd);

    let isCloudflare: boolean = false;

    const prePlugin: Plugin = {
        name: `${name}/build-pre`,
        // Ensure the redirection of `virtual:cloudflare/user-entry`.
        enforce: "pre",
        apply: "build",
        resolveId: (id: string): ResolveIdResult => {
            if (id === VIRTUAL_ENTRY) return VIRTUAL_ENTRY_RESOLVED;

            // Cloudflare environment
            if (isCloudflare && id === CLOUDFLARE_USER_ENTRY) {
                return VIRTUAL_ENTRY_RESOLVED;
            }

            return void 0;
        },
        load: async (id: string): Promise<LoadResult> => {
            if (id !== VIRTUAL_ENTRY_RESOLVED) return void 0;

            return createVirtualEntryCode({
                isCloudflare,
                packageName: name,
                resolvedOptions: opts,
            });
        },
    };

    const basePlugin: Plugin = {
        name: `${name}/build`,
        apply: "build",
        config: (config: UserConfig): UserConfig => {
            isCloudflare = hasCloudflarePlugin(config);

            const overrideConfig: UserConfig = {
                ssr: {
                    target: getSsrTarget(opts.runtime),
                    // Ensuring runtime-specific exports are selected first
                    resolve: {
                        conditions: [
                            opts.runtime,
                        ],
                        externalConditions: [
                            opts.runtime,
                        ],
                    },
                },
                build: {
                    ssr: true,
                    outDir: build.outputDir,
                    copyPublicDir: false, // Handled by copyPlugin instead
                    rolldownOptions: {
                        // Avoid client build pollution on Cloudflare environment
                        ...(isCloudflare
                            ? {}
                            : {
                                  input: VIRTUAL_ENTRY,
                              }),
                        output: {
                            entryFileNames: build.outputFile,
                            format:
                                packageJson.type === "module" ? "esm" : "cjs",
                            ...(build.bundle === "standalone" && {
                                codeSplitting: false,
                            }),
                        },
                        external: [
                            ...builtinModules,
                            /^cloudflare:/,
                        ],
                        experimental: {
                            attachDebugInfo: "none",
                        },
                    },
                    minify: build.minify,
                },
            };

            // Remove user-provided ssr.external and ssr.noExternal to avoid
            // conflicts with the bundle mode. If these were left, mergeConfig
            // would merge user values with the current config, causing unintended
            // bundling or externalization behavior.
            if (config.ssr) {
                delete config.ssr.external;
                delete config.ssr.noExternal;
            }

            if (build.bundle === "external") {
                overrideConfig.ssr = {
                    ...overrideConfig.ssr,
                    external: true,
                    noExternal: [],
                };
            }

            if (build.bundle === "standalone") {
                overrideConfig.ssr = {
                    ...overrideConfig.ssr,
                    external: [],
                    noExternal: true,
                };
            }

            return mergeConfig(config, overrideConfig);
        },
    };

    return [
        prePlugin,
        basePlugin,
    ];
};

export { buildPlugin };
