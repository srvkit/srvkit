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

export { defineServer } from "#/functions/server/define";

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

// internal (functions/build)

export type { VirtualEntryOptions } from "#/functions/build/virtual-entry";

export { createVirtualEntryCode } from "#/functions/build/virtual-entry";

// internal (functions/http)

export type { WriteHttpResponseOptions } from "#/functions/http/response/write";

export { toHeaders } from "#/functions/http/request/header";
export { writeHttpResponse } from "#/functions/http/response/write";

// internal (functions/options)

export { resolveOptions } from "#/functions/options/resolve";

// internal (functions/package)

export type {
    CompletePackageJson,
    PackageJson,
} from "#/functions/package/package-json";

export { getPackageJson } from "#/functions/package/package-json";

// internal (functions/path)

export { toPosix } from "#/functions/path/posix";
