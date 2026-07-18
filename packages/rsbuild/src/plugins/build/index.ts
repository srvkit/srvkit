import type {
    ModifyBundlerChainUtils,
    RsbuildConfig,
    RsbuildPlugin,
    RsbuildPluginAPI,
    Rspack,
    RspackChain,
} from "@rsbuild/core";
import type {
    ResolvedBuildOptions,
    ResolvedOptions,
} from "@srvkit/common/@types/options/resolved";
import type { DefinedEnv } from "@srvkit/common/functions/env/define";
import type { PackageJson } from "@srvkit/common/functions/package/package-json";

import type { LoaderOptions } from "#/plugins/build/loader";

import { builtinModules } from "node:module";
import * as Path from "node:path";

import { createVirtualEntryCode } from "@srvkit/common/functions/build/virtual-entry";
import { defineEnv } from "@srvkit/common/functions/env/define";
import { getPackageJson } from "@srvkit/common/functions/package/package-json";

import { VIRTUAL_ENTRY } from "#/constants/path";
import { getSsrTarget } from "#/functions/ssr";
import { name } from "#/root/package.json";

const LOADER_PATH: string = Path.resolve(__dirname, "loader.mjs");

const buildPlugin = (opts: ResolvedOptions): RsbuildPlugin => {
    const build: ResolvedBuildOptions = opts.build;

    const packageJson: PackageJson = getPackageJson(opts.cwd);

    return {
        name: "srvkit:build",
        apply: "build",
        async setup(api: RsbuildPluginAPI): Promise<void> {
            const isModule: boolean = packageJson.type === "module";

            const ssrTarget: Rspack.Target = getSsrTarget(opts.runtime);

            const externals: (string | RegExp)[] = [
                ...builtinModules,
                /^cloudflare:/,
            ];

            if (build.bundle === "external") {
                const depNames: string[] = [
                    ...Object.keys(packageJson.dependencies ?? {}),
                    ...Object.keys(packageJson.peerDependencies ?? {}),
                    ...Object.keys(packageJson.optionalDependencies ?? {}),
                ];

                const depExternals: RegExp[] = depNames.map(
                    (depName: string): RegExp =>
                        new RegExp(
                            `^${depName.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}([\\/]|$)`,
                        ),
                );

                externals.push(...depExternals);
            }

            const definedEnv: DefinedEnv = defineEnv({
                fallback: "production",
            });

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
                            define: definedEnv,
                        },
                        output: {
                            target: "node",
                            distPath: build.outputDir,
                            copy: void 0, // Handled by copyPlugin instead
                        },
                    };

                    // In standalone mode, force the bundler to process node_modules through SWC
                    // so transpilation config (e.g. decorators, class properties) applies to deps too.
                    // Without this, Rsbuild skips transforming node_modules by default.
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
                    // Rspack's DefinePlugin only accepts identifier chains (`a.b.c`),
                    // so method call (`Deno.env.get("NODE_ENV")`) is silently ignored.
                    // Therefore, a loader is introduced to replace them.
                    chain.module
                        .rule("replace-env")
                        .test(/\.m?[jt]sx?$/)
                        .enforce("pre")
                        .use("replace-env-loader")
                        .loader(LOADER_PATH)
                        .options({
                            replacements: [
                                {
                                    pattern:
                                        /Deno\.env\.get\(\s*["'`]NODE_ENV["'`]\s*\)/g,
                                    replacement:
                                        definedEnv["process.env.NODE_ENV"],
                                },
                            ],
                        } satisfies LoaderOptions);

                    // When `target` is `webworker`, all modules will be bundled.
                    // Therefore, this plugin is used to make them external again.
                    if (opts.runtime === "workerd") {
                        chain
                            .plugin("workerd-externals")
                            .use(rspack.ExternalsPlugin, [
                                isModule ? "module-import" : "commonjs",
                                externals,
                            ]);
                    }

                    // Add support for virtual modules
                    chain
                        .plugin("virtual-modules")
                        .use(rspack.experiments.VirtualModulesPlugin, [
                            {
                                [VIRTUAL_ENTRY]: createVirtualEntryCode({
                                    packageName: name,
                                    resolvedOptions: opts,
                                }),
                            },
                        ]);

                    // Avoid externalizing chunks
                    chain
                        .plugin("limit-chunk")
                        .use(rspack.optimize.LimitChunkCountPlugin, [
                            {
                                maxChunks: 1,
                            },
                        ]);
                },
            );

            api.modifyRspackConfig(
                (config, { mergeConfig }): Rspack.Configuration => {
                    const overrideConfig: Rspack.Configuration = {
                        resolve: {
                            /** @see https://rspack.rs/config/resolve#extend-default-value */
                            conditionNames: [
                                opts.runtime,
                                "...", // Default values
                            ],
                        },
                        target: ssrTarget,
                        externals,
                        externalsType: isModule ? "module-import" : "commonjs",
                        // Preserve real __dirname/__filename values instead of injecting
                        // Rspack polyfills — server code should use the real Node values
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

                    // target: server

                    if (build.target === "server") {
                        overrideConfig.output = {
                            ...overrideConfig.output,
                            filename: build.outputFile,
                            library: void 0, // Server target is self-starting
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
