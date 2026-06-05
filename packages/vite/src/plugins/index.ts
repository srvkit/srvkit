import type { Options, ResolvedOptions } from "@srvkit/common";
import type { Plugin } from "vite";

import { createOptions } from "@srvkit/common";

import { buildPlugin } from "#/plugins/build";
import { copyPlugin } from "#/plugins/copy";
import { devPlugin } from "#/plugins/dev";

const plugin = (options?: Options): Plugin[] => {
    const opts: ResolvedOptions = createOptions(options);

    return [
        devPlugin({
            ...opts,
        }),
        buildPlugin({
            ...opts,
        }),
        ...copyPlugin({
            ...opts,
        }),
    ];
};

export { plugin };
