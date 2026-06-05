import type { RsbuildPlugin } from "@rsbuild/core";
import type { Options } from "@srvkit/common";

import { name } from "#/root/package.json";

const plugin = (_: Options): RsbuildPlugin => {
    return {
        name,
        async setup(): Promise<void> {},
    };
};

export { plugin };
