import type {
    RsbuildConfig,
    RsbuildPlugin,
    RsbuildPluginAPI,
} from "@rsbuild/core";
import type {
    ResolvedBuildOptions,
    ResolvedOptions,
} from "@srvkit/common/@types/options/resolved";

const copyPlugin = (opts: ResolvedOptions): RsbuildPlugin[] => {
    const build: ResolvedBuildOptions = opts.build;

    if (build.target !== "server" || !build.copyPublicDir) {
        return [];
    }

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
                                        from: build.publicDir,
                                        to: build.publicDir,
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
