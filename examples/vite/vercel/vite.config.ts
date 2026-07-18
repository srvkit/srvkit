import { srvkit } from "@srvkit/vite/plugin";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        srvkit({
            build: {
                target: "handler",
            },
        }),
    ],
});
