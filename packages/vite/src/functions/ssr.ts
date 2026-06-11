import type { Runtime } from "@srvkit/common/@types/options/complete";
import type { SSRTarget } from "vite";

const getSsrTarget = (runtime: Runtime): SSRTarget => {
    switch (runtime) {
        // Cloudflare Workers runs in a Web Worker, not Node
        case "workerd":
            return "webworker";
        // Deno and Bun are Node-compatible for SSR purposes
        default:
            return "node";
    }
};

export { getSsrTarget };
