import type {
    DefinedEnv,
    DefineEnvOptions,
} from "@srvkit/common/functions/env/define/node";

import { defineEnv as defineEnvBun } from "@srvkit/common/functions/env/define/bun";
import { defineEnv as defineEnvCloudflare } from "@srvkit/common/functions/env/define/cloudflare";
import { defineEnv as defineEnvDeno } from "@srvkit/common/functions/env/define/deno";
import { defineEnv as defineEnvNode } from "@srvkit/common/functions/env/define/node";
import { afterEach, describe, expect, it } from "vitest";

type DefineEnvFn = (options: DefineEnvOptions) => DefinedEnv;

type NodeEnvValue = string | undefined;

type GlobalStub = {
    install: () => void;
    remove: () => void;
};

const FALLBACK: string = "production";

const KEYS: readonly string[] = [
    "process.env.NODE_ENV",
    'Deno.env.get("NODE_ENV")',
    "Deno.env.get('NODE_ENV')",
    "Deno.env.get(`NODE_ENV`)",
    "Bun.env.NODE_ENV",
] as const;

const runDefineEnv = (
    defineEnv: DefineEnvFn,
    nodeEnv: NodeEnvValue,
    stub?: GlobalStub,
): DefinedEnv => {
    const previous: NodeEnvValue = process.env.NODE_ENV;

    if (nodeEnv === void 0) {
        delete process.env.NODE_ENV;
    } else {
        process.env.NODE_ENV = nodeEnv;
    }

    stub?.install();

    try {
        return defineEnv({
            fallback: FALLBACK,
        });
    } finally {
        stub?.remove();
        process.env.NODE_ENV = previous;
    }
};

const createDenoStub = (nodeEnv: NodeEnvValue): GlobalStub => {
    const deno: {
        env: {
            get: (_name: string) => string | undefined;
        };
    } = {
        env: {
            get: (): string | undefined => nodeEnv,
        },
    };

    return {
        install: (): void => {
            (
                globalThis as {
                    Deno?: unknown;
                }
            ).Deno = deno;
        },
        remove: (): void => {
            delete (
                globalThis as {
                    Deno?: unknown;
                }
            ).Deno;
        },
    };
};

const createBunStub = (nodeEnv: NodeEnvValue): GlobalStub => {
    const bun: {
        env: {
            NODE_ENV: string | undefined;
        };
    } = {
        env: {
            NODE_ENV: nodeEnv,
        },
    };

    return {
        install: (): void => {
            (
                globalThis as {
                    Bun?: unknown;
                }
            ).Bun = bun;
        },
        remove: (): void => {
            delete (
                globalThis as {
                    Bun?: unknown;
                }
            ).Bun;
        },
    };
};

const assertEnvRecord = (
    result: DefinedEnv,
    expectedNodeEnv: NodeEnvValue,
): void => {
    const expectedValue: string = expectedNodeEnv ?? FALLBACK;
    const expected: string = JSON.stringify(expectedValue);

    expect(Object.keys(result).sort()).toEqual(
        [
            ...KEYS,
        ].sort(),
    );

    for (const key of KEYS) {
        expect(result[key]).toBe(expected);
    }
};

const ENV_VALUES: readonly NodeEnvValue[] = [
    "production",
    "development",
    "test",
    "",
    "a\"b",
    void 0,
];

describe("defineEnv (node)", (): void => {
    afterEach((): void => {
        delete process.env.NODE_ENV;
    });

    for (const nodeEnv of ENV_VALUES) {
        const label: string = nodeEnv === void 0 ? "unset" : `"${nodeEnv}"`;

        it(`maps all three accessors to JSON.stringify(${label})`, (): void => {
            const result: DefinedEnv = runDefineEnv(defineEnvNode, nodeEnv);

            assertEnvRecord(result, nodeEnv);
        });
    }
});

describe("defineEnv (deno)", (): void => {
    afterEach((): void => {
        delete process.env.NODE_ENV;
        delete (
            globalThis as {
                Deno?: unknown;
            }
        ).Deno;
    });

    for (const nodeEnv of ENV_VALUES) {
        const label: string = nodeEnv === void 0 ? "unset" : `"${nodeEnv}"`;

        it(`maps all three accessors to JSON.stringify(${label})`, (): void => {
            const stub: GlobalStub = createDenoStub(nodeEnv);
            const result: DefinedEnv = runDefineEnv(
                defineEnvDeno,
                nodeEnv,
                stub,
            );

            assertEnvRecord(result, nodeEnv);
        });
    }
});

describe("defineEnv (bun)", (): void => {
    afterEach((): void => {
        delete process.env.NODE_ENV;
        delete (
            globalThis as {
                Bun?: unknown;
            }
        ).Bun;
    });

    for (const nodeEnv of ENV_VALUES) {
        const label: string = nodeEnv === void 0 ? "unset" : `"${nodeEnv}"`;

        it(`maps all three accessors to JSON.stringify(${label})`, (): void => {
            const stub: GlobalStub = createBunStub(nodeEnv);
            const result: DefinedEnv = runDefineEnv(
                defineEnvBun,
                nodeEnv,
                stub,
            );

            assertEnvRecord(result, nodeEnv);
        });
    }
});

describe("defineEnv (cloudflare)", (): void => {
    afterEach((): void => {
        delete process.env.NODE_ENV;
    });

    for (const nodeEnv of ENV_VALUES) {
        const label: string = nodeEnv === void 0 ? "unset" : `"${nodeEnv}"`;

        it(`maps all three accessors to JSON.stringify(${label})`, (): void => {
            const result: DefinedEnv = runDefineEnv(
                defineEnvCloudflare,
                nodeEnv,
            );

            assertEnvRecord(result, nodeEnv);
        });
    }
});
