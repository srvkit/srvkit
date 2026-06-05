// options

export type {
    CompleteOptions,
    Runtime,
} from "#/@types/options/complete";
export type {
    BuildTarget,
    BundleMode,
    CompleteBuildBaseOptions,
    CompleteBuildHandlerOptions,
    CompleteBuildOptions,
    CompleteBuildServerOptions,
} from "#/@types/options/complete/build";
export type {
    CompleteDevOptions,
    CompleteHttpsOptions,
} from "#/@types/options/complete/dev";
export type {
    BuildOptions,
    DevOptions,
    HttpsOptions,
    Options,
} from "#/@types/options/default";
export type {
    ResolvedBuildHandlerOptions,
    ResolvedBuildOptions,
    ResolvedBuildServerOptions,
    ResolvedDevOptions,
    ResolvedHttpsOptions,
    ResolvedOptions,
} from "#/@types/options/resolved";

// define

export type {
    ErrorHandler,
    Server,
    ServerHandler,
    ServerMiddleware,
    ServerOptions,
    ServerPlugin,
    ServerRequest,
} from "#/@types/server";

export { defineServer } from "#/functions/define";

// define (node)

export type {
    AdapterMeta,
    FetchHandler,
    NodeHttpHandler,
} from "#/@types/node";

export { toFetchHandler } from "srvx/node";

// runtime

export { serve } from "srvx";

// internal (configs)

export type { ConsolaInstance } from "consola";

export { log } from "#/configs/log";

// internal (functions)

export type {
    CompletePackageJson,
    PackageJson,
} from "#/functions/package-json";

export { createOptions } from "#/functions/options";
export { getPackageJson } from "#/functions/package-json";
export { toPosix } from "#/functions/posix";
