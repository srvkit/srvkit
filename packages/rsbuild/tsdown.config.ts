import { defineConfig } from "@apst/tsdown";
import { cjsPreset, dtsPreset, esmPreset } from "@apst/tsdown/presets";

export default defineConfig(
    {
        entry: [
            // public
            "./src/index.ts",
            "./src/node.ts",
            "./src/plugin.ts",
            // internal
            "./src/runtime.ts",
            "./src/plugins/dev/index.ts",
            "./src/plugins/build/index.ts",
            "./src/plugins/build/loader.ts",
            "./src/plugins/copy/index.ts",
        ],
        platform: "node",
        unbundle: true,
    },
    [
        esmPreset(),
        cjsPreset(),
        dtsPreset({
            presetOptions: {
                performanceMode: true,
            },
        }),
    ],
);
