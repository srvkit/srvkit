import type { RsbuildInstance } from "@rsbuild/core";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { createRsbuild } from "@rsbuild/core";
import { pluginSrvkit } from "@srvkit/rsbuild/plugin";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getDistDir } from "#/helpers/fixture";

const NAME: string = "define-env";

const ENTRY_CONTENT: string = [
    "export default {",
    "    fetch: (_req: Request): Response => {",
    "        return new Response(",
    "            JSON.stringify({",
    "                node: process.env.NODE_ENV,",
    '                deno: Deno.env.get("NODE_ENV"),',
    "                denoBacktick: Deno.env.get(`NODE_ENV`),",
    "                bun: Bun.env.NODE_ENV,",
    "            }),",
    "        );",
    "    },",
    "};",
].join("\n");

const ACCESSOR_PATTERNS: readonly RegExp[] = [
    /process\.env\.NODE_ENV/,
    /Deno\.env\.get\(["'`]NODE_ENV["'`]\)/,
    /Bun\.env\.NODE_ENV/,
];

const assertNoAccessorRemains = (content: string): void => {
    for (const pattern of ACCESSOR_PATTERNS) {
        expect(pattern.test(content)).toBe(false);
    }
};

type Case = {
    readonly name: string;
    readonly nodeEnv: string | undefined;
    readonly expectedLiteral: string;
};

// Rsbuild normalizes an unset or empty `NODE_ENV` to `"production"` during the
// build, so those two cases share the same expected literal.
const CASES: readonly Case[] = [
    {
        name: "production",
        nodeEnv: "production",
        expectedLiteral: '"production"',
    },
    {
        name: "development",
        nodeEnv: "development",
        expectedLiteral: '"development"',
    },
    {
        name: "test",
        nodeEnv: "test",
        expectedLiteral: '"test"',
    },
    {
        name: "empty (normalized to production)",
        nodeEnv: "",
        expectedLiteral: '"production"',
    },
    {
        name: "unset (normalized to production)",
        nodeEnv: void 0,
        expectedLiteral: '"production"',
    },
];

describe("rsbuild define-env replacement", (): void => {
    let tempDir: string;
    let previousNodeEnv: string | undefined;

    beforeAll((): void => {
        tempDir = createFixture(BASE_DIR, NAME, {
            entryContent: ENTRY_CONTENT,
        });
        previousNodeEnv = process.env.NODE_ENV;
    });

    afterEach((): void => {
        if (previousNodeEnv === void 0) {
            delete process.env.NODE_ENV;
        } else {
            process.env.NODE_ENV = previousNodeEnv;
        }
    });

    afterAll((): void => {
        cleanupFixture(BASE_DIR, NAME);
    });

    for (const testCase of CASES) {
        it(`replaces all three accessors when NODE_ENV is ${testCase.name}`, async (): Promise<void> => {
            if (testCase.nodeEnv === void 0) {
                delete process.env.NODE_ENV;
            } else {
                process.env.NODE_ENV = testCase.nodeEnv;
            }

            const rsbuild: RsbuildInstance = await createRsbuild({
                cwd: tempDir,
                rsbuildConfig: {
                    plugins: [
                        pluginSrvkit({
                            cwd: tempDir,
                            entry: "./src/index.ts",
                        }),
                    ],
                    logLevel: "silent",
                },
            });

            await rsbuild.build();

            const outputFile: string = Path.resolve(
                getDistDir(BASE_DIR, NAME),
                "index.js",
            );

            expect(Fs.existsSync(outputFile)).toBe(true);

            const content: string = Fs.readFileSync(outputFile, "utf-8");

            expect(content.length).toBeGreaterThan(0);
            expect(content.includes(testCase.expectedLiteral)).toBe(true);
            assertNoAccessorRemains(content);
        }, 30000);
    }
});
