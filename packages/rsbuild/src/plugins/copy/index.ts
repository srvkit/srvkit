import type {
    RsbuildConfig,
    RsbuildPlugin,
    RsbuildPluginAPI,
} from "@rsbuild/core";
import type {
    ResolvedBuildOptions,
    ResolvedBuildPublicOptions,
    ResolvedOptions,
} from "@srvkit/common/@types/options/resolved";

import * as Path from "node:path";

const copyPlugin = (opts: ResolvedOptions): RsbuildPlugin[] => {
    const build: ResolvedBuildOptions = opts.build;
    const publicDir: ResolvedBuildPublicOptions = build.public;

    if (!publicDir.copy) return [];

    return [
        {
            name: "srvkit:copy",
            apply: "build",
            async setup(api: RsbuildPluginAPI): Promise<void> {
                api.modifyRsbuildConfig(
                    (config: RsbuildConfig): RsbuildConfig => {
                        return {
                            ...config,
                            output: {
                                ...config.output,
                                copy: [
                                    {
                                        from: publicDir.from,
                                        to: Path.resolve(
                                            opts.cwd,
                                            build.outputDir,
                                            publicDir.to ?? publicDir.from,
                                        ),
                                    },
                                ],
                            },
                        };
                    },
                );
            },
        },
    ];
};

export { copyPlugin };
