import { cloudflare } from "@cloudflare/vite-plugin";
import { srvkit } from "@srvkit/vite/plugin";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        cloudflare(),
        srvkit({
            runtime: "workerd",
            build: {
                target: "handler",
                public: {
                    copy: true,
                    to: "./client",
                },
            },
        }),
    ],
});
