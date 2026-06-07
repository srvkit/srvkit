import * as Fs from "node:fs";
import * as Path from "node:path";

import { srvkit } from "@srvkit/vite/plugin";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getDistDir } from "#/helpers/fixture";

const NAME: string = "plugin";

describe("vite plugin", (): void => {
    let tempDir: string;

    beforeAll((): void => {
        tempDir = createFixture(BASE_DIR, NAME);
    });

    afterAll((): void => {
        cleanupFixture(BASE_DIR, NAME);
    });

    it("produces output file for server target with external bundle", async (): Promise<void> => {
        await build({
            root: tempDir,
            plugins: [
                srvkit({
                    cwd: tempDir,
                    entry: "./src/index.ts",
                }),
            ],
            logLevel: "silent",
        });

        const outputFile: string = Path.resolve(
            getDistDir(BASE_DIR, NAME),
            "index.js",
        );

        expect(Fs.existsSync(outputFile)).toBe(true);

        const content: string = Fs.readFileSync(outputFile, "utf-8");

        expect(content.length).toBeGreaterThan(0);
    }, 30000);

    it("produces output file with export default for handler target", async (): Promise<void> => {
        await build({
            root: tempDir,
            plugins: [
                srvkit({
                    cwd: tempDir,
                    entry: "./src/index.ts",
                    build: {
                        target: "handler",
                    },
                }),
            ],
            logLevel: "silent",
        });

        const outputFile: string = Path.resolve(
            getDistDir(BASE_DIR, NAME),
            "index.js",
        );

        expect(Fs.existsSync(outputFile)).toBe(true);

        const content: string = Fs.readFileSync(outputFile, "utf-8");

        expect(content.length).toBeGreaterThan(0);
    }, 30000);
});
