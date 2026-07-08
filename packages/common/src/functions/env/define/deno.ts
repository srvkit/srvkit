import type { DefinedEnv, DefineEnvOptions } from "#/functions/env/define/node";

interface DenoEnv {
    get: (name: string) => string | undefined;
}

interface Deno {
    env: DenoEnv;
}

declare global {
    var Deno: Deno;
}

const defineEnv = (options: DefineEnvOptions): DefinedEnv => {
    const rawNodeEnv: string | undefined = Deno.env.get("NODE_ENV");
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
