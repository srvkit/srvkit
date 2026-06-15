import type { EnvNumber } from "@srvkit/common/plugin";

import { resolveNumber } from "@srvkit/common/functions/env/resolve";
import { env } from "@srvkit/common/plugin";
import { afterEach, describe, expect, it } from "vitest";

describe("resolveNumber", (): void => {
    afterEach((): void => {
        delete process.env._TEST_PORT;
        delete process.env._TEST_EMPTY;
    });

    it("returns undefined for undefined value", (): void => {
        const result: number | undefined = resolveNumber(undefined);

        expect(result).toBeUndefined();
    });

    it("returns number directly when value is a plain number", (): void => {
        const result: number | undefined = resolveNumber(42);

        expect(result).toBe(42);
    });

    it("resolves EnvNumber from process.env", (): void => {
        process.env._TEST_PORT = "3000";

        const envNum: EnvNumber = env.number("_TEST_PORT");

        const result: number | undefined = resolveNumber(envNum);

        expect(result).toBe(3000);
    });

    it("returns undefined when env var is not set and no fallback", (): void => {
        const envNum: EnvNumber = env.number("_TEST_EMPTY");

        const result: number | undefined = resolveNumber(envNum);

        expect(result).toBeUndefined();
    });

    it("returns fallback when env var is not set and fallback arg is provided", (): void => {
        const envNum: EnvNumber = env.number("_TEST_EMPTY");

        const result: number | undefined = resolveNumber(envNum, 3000);

        expect(result).toBe(3000);
    });

    it("returns env var value when env var is set and fallback arg is provided", (): void => {
        process.env._TEST_PORT = "8080";

        const envNum: EnvNumber = env.number("_TEST_PORT");

        const result: number | undefined = resolveNumber(envNum, 3000);

        expect(result).toBe(8080);
    });

    it("uses existing fallback on EnvNumber when env var is not set", (): void => {
        const envNum: EnvNumber<3000> = env.number("_TEST_EMPTY", 3000);

        const result: number | undefined = resolveNumber(envNum);

        expect(result).toBe(3000);
    });

    it("returns env var value when EnvNumber has existing fallback and env var is set", (): void => {
        process.env._TEST_PORT = "8080";

        const envNum: EnvNumber<number> = env.number("_TEST_PORT", 3000);

        const result: number | undefined = resolveNumber(envNum);

        expect(result).toBe(8080);
    });
});
