import type { RsbuildPlugin } from "@rsbuild/core";
import type { Options } from "@srvkit/common/@types/options/default";
import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";

import { resolveOptions } from "@srvkit/common/functions/options/resolve";

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
