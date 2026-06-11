import type { Rspack } from "@rsbuild/core";
import type { Runtime } from "@srvkit/common/@types/options/complete";

const getSsrTarget = (runtime: Runtime): Rspack.Target => {
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
