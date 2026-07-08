import type { DefinedEnv, DefineEnvOptions } from "#/functions/env/define/node";

interface BunEnv {
    NODE_ENV: string | undefined;
}

interface Bun {
    env: BunEnv;
}

declare global {
    var Bun: Bun;
}

const defineEnv = (options: DefineEnvOptions): DefinedEnv => {
    const rawNodeEnv: string | undefined = Bun.env.NODE_ENV;
    const nodeEnv: string = rawNodeEnv ?? options.fallback;
    const serialized: string = JSON.stringify(nodeEnv);

    return {
        "process.env.NODE_ENV": serialized,
        'Deno.env.get("NODE_ENV")': serialized,
        "Deno.env.get('NODE_ENV')": serialized,
        "Deno.env.get(`NODE_ENV`)": serialized,
        "Bun.env.NODE_ENV": serialized,
    };
};

export type { DefinedEnv, DefineEnvOptions };
export { defineEnv };
