import { defineConfig } from "@apst/tsdown";
import { cjsPreset, dtsPreset, esmPreset } from "@apst/tsdown/presets";

export default defineConfig(
    {
        entry: {
            // public
            node: "./src/node.ts",
            runtime: "./src/runtime.ts",
            // @types
            "@types/node": "./src/@types/node.ts",
            "@types/server": "./src/@types/server.ts",
            "@types/options/complete/index":
                "./src/@types/options/complete/index.ts",
            "@types/options/complete/build":
                "./src/@types/options/complete/build.ts",
            "@types/options/complete/dev":
                "./src/@types/options/complete/dev.ts",
            "@types/options/default": "./src/@types/options/default.ts",
            "@types/options/resolved": "./src/@types/options/resolved.ts",
            // configs
            "configs/log": "./src/configs/log.ts",
            // functions
            "functions/build/virtual-entry":
                "./src/functions/build/virtual-entry.ts",
            "functions/http/request/header":
                "./src/functions/http/request/header.ts",
            "functions/http/response/write":
                "./src/functions/http/response/write.ts",
            "functions/options/resolve": "./src/functions/options/resolve.ts",
            "functions/package/package-json":
                "./src/functions/package/package-json.ts",
            "functions/path/posix": "./src/functions/path/posix.ts",
            "functions/server/define": "./src/functions/server/define.ts",
            "functions/server/live": "./src/functions/server/live.ts",
        },
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
