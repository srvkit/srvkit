import type { Omit } from "ts-vista";

import type { Options } from "#/@types/options/default";
import type {
    ResolvedBuildHandlerOptions,
    ResolvedBuildServerOptions,
    ResolvedOptions,
} from "#/@types/options/resolved";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { toMerged } from "es-toolkit";

const DEV_FALLBACKS = {
    host: "localhost",
    port: 3001,
} as const;

const BUILD_SERVER_FALLBACKS = {
    host: "localhost",
    port: 3000,
} as const;

const OPTIONS_BUILD_SERVER: ResolvedBuildServerOptions = {
    ...BUILD_SERVER_FALLBACKS,
    target: "server",
    bundle: "external",
    outputDir: "./dist",
    outputFile: "index.js",
    minify: false,
    publicDir: "./public",
    copyPublicDir: false,
};

const OPTIONS_BUILD_HANDLER: ResolvedBuildHandlerOptions = {
    target: "handler",
    bundle: "external",
    outputDir: "./dist",
    outputFile: "index.js",
    minify: false,
};

const OPTIONS_DEFAULT: Omit<ResolvedOptions, "entry" | "build"> = {
    cwd: process.cwd(),
    runtime: "node",
    dev: DEV_FALLBACKS,
    verbose: false,
};

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

export { BUILD_SERVER_FALLBACKS, DEV_FALLBACKS, resolveOptions };
