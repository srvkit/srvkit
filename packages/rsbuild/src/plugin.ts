export type {
    ResolvableNumber,
    ResolvableString,
} from "@srvkit/common/@types/env";
export type { Runtime } from "@srvkit/common/@types/options/complete";
export type {
    BuildTarget,
    BundleMode,
} from "@srvkit/common/@types/options/complete/build";
export type {
    BuildOptions,
    DevOptions,
    HttpsOptions,
    Options,
} from "@srvkit/common/@types/options/default";
export type {
    EnvBoolean,
    EnvFunctions,
    EnvNumber,
    EnvString,
} from "@srvkit/common/plugin";

export { env } from "@srvkit/common/plugin";

export { plugin as pluginSrvkit } from "#/plugins";
