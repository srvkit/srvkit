import { defineConfig } from "@apst/tsdown";
import { cjsPreset, dtsPreset, esmPreset } from "@apst/tsdown/presets";

export default defineConfig(
    {
        entry: {
            // public
            index: "./src/index.ts",
            node: "./src/node.ts",
            plugin: "./src/plugin.ts",
            // internal
            runtime: "./src/runtime.ts",
            "plugins/dev/index": "./src/plugins/dev/index.ts",
            "plugins/build/index": "./src/plugins/build/index.ts",
            "plugins/copy/index": "./src/plugins/copy/index.ts",
        },
        platform: "node",
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
