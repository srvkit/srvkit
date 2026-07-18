import { defineConfig } from "@rsbuild/core";
import { pluginSrvkit } from "@srvkit/rsbuild/plugin";

export default defineConfig({
    plugins: [
        pluginSrvkit({
            build: {
                target: "handler",
            },
        }),
    ],
});
