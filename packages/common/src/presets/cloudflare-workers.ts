import type { Options } from "#/@types/options/default";

const cloudflareWorkersPreset = (options?: Options): Options => {
    return {
        ...options,
        runtime: "workerd",
        build: {
            ...options?.build,
            target: "handler",
            public: {
                copy: true,
                to: "./client",
                ...options?.build?.public,
            },
        },
    };
};

export { cloudflareWorkersPreset };
