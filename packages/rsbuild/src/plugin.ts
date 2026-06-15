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
    EnvValue,
    Infer,
    IsFunctions,
} from "@srvkit/common/plugin";

export { env, is } from "@srvkit/common/plugin";

export { plugin as pluginSrvkit } from "#/plugins";
