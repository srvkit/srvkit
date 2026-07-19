import type { Options } from "@srvkit/common/@types/options/default";

import { cloudflareWorkersPreset } from "@srvkit/common/presets";
import { describe, expect, it } from "vitest";

describe("cloudflareWorkersPreset", (): void => {
    it("returns default cloudflare options when called with no args", (): void => {
        const result: Options = cloudflareWorkersPreset();

        expect(result.runtime).toBe("workerd");
        expect(result.build?.target).toBe("handler");
        expect(result.build?.public?.copy).toBe(true);
        expect(result.build?.public?.to).toBe("./client");
    });

    it("preserves caller-supplied top-level options", (): void => {
        const result: Options = cloudflareWorkersPreset({
            cwd: "/path",
            entry: "./src/index.ts",
            verbose: true,
        });

        expect(result.runtime).toBe("workerd");
        expect(result.build?.target).toBe("handler");
        expect(result.cwd).toBe("/path");
        expect(result.entry).toBe("./src/index.ts");
        expect(result.verbose).toBe(true);
    });

    it("avoid caller to override preset runtime", (): void => {
        const result: Options = cloudflareWorkersPreset({
            runtime: "node",
        });

        expect(result.runtime).toBe("workerd");
        expect(result.build?.target).toBe("handler");
    });

    it("avoid caller to override build.target", (): void => {
        const result: Options = cloudflareWorkersPreset({
            build: {
                target: "server",
            },
        });

        expect(result.runtime).toBe("workerd");
        expect(result.build?.target).toBe("handler");
    });

    it("allows caller to override individual build.public fields", (): void => {
        const result: Options = cloudflareWorkersPreset({
            build: {
                public: {
                    to: "./assets",
                },
            },
        });

        expect(result.runtime).toBe("workerd");
        expect(result.build?.target).toBe("handler");
        expect(result.build?.public?.copy).toBe(true);
        expect(result.build?.public?.to).toBe("./assets");
    });

    it("does not mutate the input options argument", (): void => {
        const input: Options = {
            build: {
                public: {
                    to: "./assets",
                },
            },
        };

        const inputCopy: Options = {
            build: {
                public: {
                    to: "./assets",
                },
            },
        };

        cloudflareWorkersPreset(input);

        expect(input).toEqual(inputCopy);
    });
});
