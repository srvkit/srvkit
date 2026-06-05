import type { Options } from "@srvkit/common";
import type { Plugin } from "vite";

import { name, version } from "#/root/package.json";

const plugin = (_: Options): Plugin => {
    return {
        name,
        version,
    };
};

export { plugin };
