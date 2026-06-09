import type {
    ModifyBundlerChainUtils,
    RsbuildConfig,
    RsbuildPlugin,
    RsbuildPluginAPI,
    Rspack,
    RspackChain,
} from "@rsbuild/core";
import type {
    PackageJson,
    ResolvedBuildOptions,
    ResolvedOptions,
} from "@srvkit/common";

import { builtinModules } from "node:module";

import { createVirtualEntryCode, getPackageJson } from "@srvkit/common";

import { VIRTUAL_ENTRY } from "#/constants/path";
import { getSsrTarget } from "#/functions/ssr";
import { name } from "#/root/package.json";

const buildPlugin = (opts: ResolvedOptions): RsbuildPlugin => {
    const build: ResolvedBuildOptions = opts.build;

    const packageJson: PackageJson = getPackageJson(opts.cwd);

    return {
        name: "srvkit:build",
        apply: "build",
        async setup(api: RsbuildPluginAPI): Promise<void> {
            const ssrTarget: Rspack.Target = getSsrTarget(opts.runtime);

            api.modifyRsbuildConfig(
                (
                    config: RsbuildConfig,
                    { mergeRsbuildConfig },
                ): RsbuildConfig => {
                    const overrideConfig: RsbuildConfig = {
                        source: {
                            entry: {
                                index: VIRTUAL_ENTRY,
                            },
                        },
                        output: {
                            target: "node",
                            distPath: build.outputDir,
                            copy: void 0,
                        },
                    };

                    // Enforce the bundler to apply SWC configuration to third-party dependencies
                    if (build.bundle === "standalone") {
                        overrideConfig.source = {
                            ...overrideConfig.source,
                            include: [
                                ...(overrideConfig.source?.include ?? []),
                                /[\\/]node_modules[\\/]/,
                            ],
                        };
                    }

                    return mergeRsbuildConfig(config, overrideConfig);
                },
            );

            api.modifyBundlerChain(
                (
                    chain: RspackChain,
                    { rspack }: ModifyBundlerChainUtils,
                ): void => {
                    // Avoid externalizing chunks
                    chain
                        .plugin("limit-chunk")
                        .use(rspack.optimize.LimitChunkCountPlugin, [
                            {
                                maxChunks: 1,
                            },
                        ]);

                    // Add support for virtual modules
                    chain
                        .plugin("virtual-modules")
                        .use(rspack.experiments.VirtualModulesPlugin, [
                            {
                                [VIRTUAL_ENTRY]: createVirtualEntryCode({
                                    ...opts,
                                    packageName: name,
                                }),
                            },
                        ]);
                },
            );

            api.modifyRspackConfig(
                (config, { mergeConfig }): Rspack.Configuration => {
                    const isModule: boolean = packageJson.type === "module";

                    const nodeExternals: (string | RegExp)[] = [
                        ...builtinModules,
                        /^node:/,
                    ];

                    const overrideConfig: Rspack.Configuration = {
                        resolve: {
                            /** @see https://rspack.rs/config/resolve#extend-default-value */
                            conditionNames: [
                                opts.runtime,
                                "...", // Default values
                            ],
                        },
                        target: ssrTarget,
                        node: {
                            __dirname: false,
                            __filename: false,
                        },
                        optimization: {
                            minimize: build.minify,
                            splitChunks: false,
                            runtimeChunk: false,
                        },
                    };

                    // bundle: external

                    if (build.bundle === "external") {
                        const depNames: string[] = [
                            ...Object.keys(packageJson.dependencies ?? {}),
                            ...Object.keys(packageJson.peerDependencies ?? {}),
                            ...Object.keys(
                                packageJson.optionalDependencies ?? {},
                            ),
                        ];

                        const depExternals: RegExp[] = depNames.map(
                            (name: string): RegExp =>
                                new RegExp(
                                    `^${name.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}([\\/]|$)`,
                                ),
                        );

                        overrideConfig.externals = [
                            ...nodeExternals,
                            ...depExternals,
                        ];

                        overrideConfig.externalsType = isModule
                            ? "module-import"
                            : "commonjs";
                    }

                    // bundle: standalone

                    if (build.bundle === "standalone") {
                        overrideConfig.externals = nodeExternals;
                    }

                    // target: server

                    if (build.target === "server") {
                        overrideConfig.output = {
                            ...overrideConfig.output,
                            filename: build.outputFile,
                            library: void 0,
                            ...(isModule
                                ? {
                                      module: true,
                                  }
                                : {}),
                        };
                    }

                    // target: handler

                    if (build.target === "handler") {
                        overrideConfig.output = {
                            ...overrideConfig.output,
                            filename: build.outputFile,
                            library: {
                                type: isModule ? "module" : "commonjs2",
                                export: "default",
                            },
                            ...(isModule
                                ? {
                                      module: true,
                                  }
                                : {}),
                        };
                    }

                    return mergeConfig(config, overrideConfig);
                },
            );
        },
    };
};

export { buildPlugin };
