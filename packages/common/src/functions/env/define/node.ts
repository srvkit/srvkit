type DefineEnvOptions = {
    fallback: string;
};

type DefinedEnv = {
    "process.env.NODE_ENV": string;
    'Deno.env.get("NODE_ENV")': string;
    "Deno.env.get('NODE_ENV')": string;
    "Deno.env.get(`NODE_ENV`)": string;
    "Bun.env.NODE_ENV": string;
};

const defineEnv = (options: DefineEnvOptions): DefinedEnv => {
    const rawNodeEnv: string | undefined = process.env.NODE_ENV;
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
