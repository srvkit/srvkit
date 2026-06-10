import type { RsbuildInstance } from "@rsbuild/core";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { createRsbuild } from "@rsbuild/core";
import { pluginSrvkit } from "@srvkit/rsbuild/plugin";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getDistDir } from "#/helpers/fixture";

const NAME: string = "plugin";

describe("rsbuild plugin", (): void => {
    let tempDir: string;

    beforeAll((): void => {
        tempDir = createFixture(BASE_DIR, NAME);
    });

    afterAll((): void => {
        cleanupFixture(BASE_DIR, NAME);
    });

    it("produces output file for server target with external bundle", async (): Promise<void> => {
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
    }, 15000);

    it("produces output file with export default for handler target", async (): Promise<void> => {
        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    pluginSrvkit({
                        cwd: tempDir,
                        entry: "./src/index.ts",
                        build: {
                            target: "handler",
                        },
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
    }, 15000);
});
