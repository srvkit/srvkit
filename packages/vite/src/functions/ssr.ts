import type { Runtime } from "@srvkit/common/@types/options/complete";
import type { SSRTarget } from "vite";

const getSsrTarget = (runtime: Runtime): SSRTarget => {
    switch (runtime) {
        case "workerd":
            return "webworker";
        default:
            return "node";
    }
};

export { getSsrTarget };
