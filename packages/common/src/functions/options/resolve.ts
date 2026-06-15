import type { Omit } from "ts-vista";

import type { Options } from "#/@types/options/default";
import type { ResolvedOptions } from "#/@types/options/resolved";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { toMerged } from "es-toolkit";

import {
    OPTIONS_BUILD_HANDLER,
    OPTIONS_BUILD_SERVER,
    OPTIONS_DEFAULT,
} from "#/consts/options";

const getDefaultOptions = (
    isHandler: boolean,
): Omit<ResolvedOptions, "entry"> => {
    return {
        ...OPTIONS_DEFAULT,
        build: isHandler ? OPTIONS_BUILD_HANDLER : OPTIONS_BUILD_SERVER,
    };
};

const ENTRY_DEFAULT: string[] = [
    "./src/index.ts",
    "./src/index.js",
];

const getEntry = (cwd: string, entry?: string): string => {
    if (!entry) {
        for (const ent of ENTRY_DEFAULT) {
            if (Fs.existsSync(Path.resolve(cwd, ent))) {
                entry = ent;
                break;
            }
        }

        if (!entry) {
            throw new Error("No entry file found");
        }
    }

    return Path.resolve(cwd, entry);
};

const resolveOptions = (options?: Options): ResolvedOptions => {
    const isHandler: boolean = options?.build?.target === "handler";

    const merged = toMerged(getDefaultOptions(isHandler), options ?? {});

    return {
        ...merged,
        entry: getEntry(merged.cwd, options?.entry),
    };
};

export { resolveOptions };
