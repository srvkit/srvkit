import type { Rspack } from "@rsbuild/core";
import type { Runtime } from "@srvkit/common";

const getSsrTarget = (runtime: Runtime): Rspack.Target => {
    switch (runtime) {
        case "workerd":
            return "webworker";
        default:
            return "node";
    }
};

export { getSsrTarget };
