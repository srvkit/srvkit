import type {
    ResolvedBuildHandlerOptions,
    ResolvedBuildServerOptions,
    ResolvedOptions,
} from "#/@types/options/resolved";

const OPTIONS_DEV = {
    host: "localhost",
    port: 3001,
} as const;

const OPTIONS_BUILD_SERVER_BASE = {
    host: "localhost",
    port: 3000,
} as const;

const OPTIONS_BUILD_PUBLIC = {
    copy: false,
    from: "./public",
} as const;

const OPTIONS_BUILD_SERVER: ResolvedBuildServerOptions = {
    ...OPTIONS_BUILD_SERVER_BASE,
    target: "server",
    bundle: "external",
    outputDir: "./dist",
    outputFile: "index.js",
    minify: false,
    public: OPTIONS_BUILD_PUBLIC,
};

const OPTIONS_BUILD_HANDLER: ResolvedBuildHandlerOptions = {
    target: "handler",
    bundle: "external",
    outputDir: "./dist",
    outputFile: "index.js",
    minify: false,
    public: OPTIONS_BUILD_PUBLIC,
};

const OPTIONS_DEFAULT: Omit<ResolvedOptions, "entry" | "build"> = {
    cwd: process.cwd(),
    runtime: "node",
    dev: OPTIONS_DEV,
    verbose: false,
};

export {
    OPTIONS_BUILD_HANDLER,
    OPTIONS_BUILD_PUBLIC,
    OPTIONS_BUILD_SERVER,
    OPTIONS_BUILD_SERVER_BASE,
    OPTIONS_DEFAULT,
    OPTIONS_DEV,
};
