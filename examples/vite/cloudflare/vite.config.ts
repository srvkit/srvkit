import { cloudflare } from "@cloudflare/vite-plugin";
import { srvkit } from "@srvkit/vite/plugin";
import { cloudflareWorkersPreset } from "@srvkit/vite/presets";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        cloudflare(),
        srvkit(cloudflareWorkersPreset()),
    ],
});
