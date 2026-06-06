import type { RsbuildPlugin } from "@rsbuild/core";
import type { Options, ResolvedOptions } from "@srvkit/common";

import { resolveOptions } from "@srvkit/common";

import { buildPlugin } from "#/plugins/build";
import { copyPlugin } from "#/plugins/copy";
import { devPlugin } from "#/plugins/dev";

const plugin = (options?: Options): RsbuildPlugin[] => {
    const opts: ResolvedOptions = resolveOptions(options);

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
