import type { ResolvedBuildOptions, ResolvedOptions } from "@srvkit/common";
import type { CopyEvent, Options as Copyoptions } from "rolldown-plugin-copy";
import type { Plugin } from "vite";

import * as Path from "node:path";

import { log } from "@srvkit/common";
import { copy } from "rolldown-plugin-copy";

const copyPlugin = (opts: ResolvedOptions): Plugin[] => {
    const build: ResolvedBuildOptions = opts.build;

    if (build.target !== "server" || !build.copyPublicDir) {
        return [];
    }

    const copyOptions: Copyoptions = {
        targets: [
            {
                src: Path.posix.join(build.publicDir, "**", "*"),
                dest: Path.posix.join(build.outputDir, build.publicDir),
            },
        ],
    };

    if (opts.verbose) {
        copyOptions.onStart = (): void => {
            console.log("");
            console.log("");
        };

        copyOptions.onCopy = (event: CopyEvent): void => {
            const src: string = Path.relative(opts.cwd, event.target.src);

            const dest: string = Path.relative(opts.cwd, event.target.dest);

            let message: string = `${src} → ${dest}`;

            const flags: string[] = [];

            if (event.target.renamed) {
                flags.push("R");
            }

            if (event.target.transformed) {
                flags.push("T");
            }

            if (flags.length > 0) {
                message += ` [${flags.join(",")}]`;
            }

            log.success(message);
        };

        copyOptions.onEnd = (): void => {
            console.log("");
        };
    }

    return [
        copy(copyOptions) as Plugin,
    ];
};

export { copyPlugin };
