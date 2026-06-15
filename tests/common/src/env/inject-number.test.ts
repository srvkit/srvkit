import type { EnvNumber } from "@srvkit/common/plugin";

import { injectNumber } from "@srvkit/common/functions/env/inject";
import { env } from "@srvkit/common/plugin";
import { describe, expect, it } from "vitest";

describe("injectNumber", (): void => {
    it("returns JSON-stringified value for plain number", (): void => {
        const result: string = injectNumber(42);

        expect(result).toBe("42");
    });

    it("calls inject on EnvNumber without fallback", (): void => {
        const envNum: EnvNumber = env.number("PORT");

        const result: string = injectNumber(envNum);

        expect(result).toBe(
            "(!Number.isNaN(Number(process.env.PORT)) ? Number(process.env.PORT) : void 0)",
        );
    });

    it("calls inject on EnvNumber with fallback arg", (): void => {
        const envNum: EnvNumber = env.number("PORT");

        const result: string = injectNumber(envNum, 3000);

        expect(result).toBe(
            "(!Number.isNaN(Number(process.env.PORT)) ? Number(process.env.PORT) : 3000)",
        );
    });

    it("uses existing fallback on EnvNumber", (): void => {
        const envNum: EnvNumber<number> = env.number("PORT", 3000);

        const result: string = injectNumber(envNum);

        expect(result).toBe(
            "(!Number.isNaN(Number(process.env.PORT)) ? Number(process.env.PORT) : 3000)",
        );
    });
});
