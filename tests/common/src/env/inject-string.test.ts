import type { EnvString } from "@srvkit/common/plugin";

import { injectString } from "@srvkit/common/functions/env/inject";
import { env } from "@srvkit/common/plugin";
import { describe, expect, it } from "vitest";

const hello = "Hello" as const;

const helloWorld = "Hello, World!" as const;

describe("injectString", (): void => {
    it("returns JSON-stringified value for plain string", (): void => {
        const result: string = injectString(hello);

        expect(result).toBe(`"${hello}"`);
    });

    it("returns JSON-stringified value for plain string with special characters", (): void => {
        const result: string = injectString(helloWorld);

        expect(result).toBe(`"${helloWorld}"`);
    });

    it("calls inject on EnvString without fallback", (): void => {
        const envStr: EnvString = env.string("HOST");

        const result: string = injectString(envStr);

        expect(result).toBe("process.env.HOST");
    });

    it("calls inject on EnvString with fallback arg", (): void => {
        const envStr: EnvString = env.string("HOST");

        const result: string = injectString(envStr, "localhost");

        expect(result).toBe('(process.env.HOST ?? "localhost")');
    });

    it("uses existing fallback on EnvString", (): void => {
        const envStr: EnvString<string> = env.string("HOST", "localhost");

        const result: string = injectString(envStr);

        expect(result).toBe('(process.env.HOST ?? "localhost")');
    });
});
