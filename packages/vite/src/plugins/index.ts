import type { Options } from "@srvkit/common/@types/options/default";
import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";
import type { Plugin } from "vite";

import { defineEnv } from "@srvkit/common/functions/env/define";
import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { replacePlugin } from "rolldown/plugins";

import { buildPlugin } from "#/plugins/build";
import { copyPlugin } from "#/plugins/copy";
import { devPlugin } from "#/plugins/dev";

const plugin = (options?: Options): Plugin[] => {
    const opts: ResolvedOptions = resolveOptions(options);

    return [
        replacePlugin(
            defineEnv({
                fallback: "production",
            }),
            {
                delimiters: [
                    "\\b",
                    "(?![A-Za-z0-9_$])",
                ],
                preventAssignment: true,
                sourcemap: true,
            },
        ),
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
