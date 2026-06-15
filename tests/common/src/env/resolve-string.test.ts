import type { EnvString } from "@srvkit/common/plugin";

import { resolveString } from "@srvkit/common/functions/env/resolve";
import { env } from "@srvkit/common/plugin";
import { afterEach, describe, expect, it } from "vitest";

describe("resolveString", (): void => {
    afterEach((): void => {
        delete process.env._TEST_HOST;
        delete process.env._TEST_EMPTY;
    });

    it("returns undefined for undefined value", (): void => {
        const result: string | undefined = resolveString(undefined);

        expect(result).toBeUndefined();
    });

    it("returns string directly when value is a plain string", (): void => {
        const result: string | undefined = resolveString("hello");

        expect(result).toBe("hello");
    });

    it("resolves EnvString from process.env", (): void => {
        process.env._TEST_HOST = "production";

        const envStr: EnvString = env.string("_TEST_HOST");

        const result: string | undefined = resolveString(envStr);

        expect(result).toBe("production");
    });

    it("returns undefined when env var is not set and no fallback", (): void => {
        const envStr: EnvString = env.string("_TEST_EMPTY");

        const result: string | undefined = resolveString(envStr);

        expect(result).toBeUndefined();
    });

    it("returns fallback when env var is not set and fallback arg is provided", (): void => {
        const envStr: EnvString = env.string("_TEST_EMPTY");

        const result: string | undefined = resolveString(envStr, "localhost");

        expect(result).toBe("localhost");
    });

    it("returns env var value when env var is set and fallback arg is provided", (): void => {
        process.env._TEST_HOST = "production";

        const envStr: EnvString = env.string("_TEST_HOST");

        const result: string | undefined = resolveString(envStr, "localhost");

        expect(result).toBe("production");
    });

    it("uses existing fallback on EnvString when env var is not set", (): void => {
        const envStr: EnvString<"default"> = env.string(
            "_TEST_EMPTY",
            "default",
        );

        const result: string | undefined = resolveString(envStr);

        expect(result).toBe("default");
    });

    it("returns env var value when EnvString has existing fallback and env var is set", (): void => {
        process.env._TEST_HOST = "production";

        const envStr: EnvString<string> = env.string("_TEST_HOST", "default");

        const result: string | undefined = resolveString(envStr);

        expect(result).toBe("production");
    });
});
