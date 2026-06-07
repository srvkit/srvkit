import type { ResolvedOptions } from "@srvkit/common";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { resolveOptions } from "@srvkit/common";
import { buildPlugin } from "@srvkit/vite/plugins/build";
import { copyPlugin } from "@srvkit/vite/plugins/copy";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanupFixture, createFixture, getDistDir } from "./helpers/fixture";

const BASE_DIR: string = process.cwd();

describe("vite copy plugin", (): void => {
    let tempDir: string;

    beforeAll((): void => {
        tempDir = createFixture(BASE_DIR, "copy", {
            publicFiles: {
                "hello.txt": "Hello from public!",
            },
        });
    });

    afterAll((): void => {
        cleanupFixture(BASE_DIR, "copy");
    });

    it("copies public directory when target is server and copyPublicDir is true", async (): Promise<void> => {
        const distDir: string = Path.resolve(getDistDir(BASE_DIR, "copy"));

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "server",
                outputDir: distDir,
                copyPublicDir: true,
            },
        });

        await build({
            root: tempDir,
            logLevel: "silent",
            plugins: [
                buildPlugin(opts),
                ...copyPlugin(opts),
            ],
        });

        expect(Fs.existsSync(distDir)).toBe(true);

        const outputFile: string = Path.resolve(distDir, "index.js");

        expect(Fs.existsSync(outputFile)).toBe(true);

        const publicFile: string = Path.resolve(distDir, "public", "hello.txt");

        expect(Fs.existsSync(publicFile)).toBe(true);

        const content: string = Fs.readFileSync(publicFile, "utf-8");

        expect(content).toBe("Hello from public!");
    }, 30000);

    it("does not copy when copyPublicDir is false", async (): Promise<void> => {
        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "server",
                copyPublicDir: false,
            },
        });

        await build({
            root: tempDir,
            logLevel: "silent",
            plugins: [
                buildPlugin(opts),
                ...copyPlugin(opts),
            ],
        });

        const publicDir: string = Path.resolve(
            getDistDir(BASE_DIR, "copy"),
            "public",
        );

        expect(Fs.existsSync(publicDir)).toBe(false);
    }, 30000);

    it("does not copy when target is handler", async (): Promise<void> => {
        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "handler",
                // @ts-expect-error
                copyPublicDir: true,
            },
        });

        await build({
            root: tempDir,
            logLevel: "silent",
            plugins: [
                buildPlugin(opts),
                ...copyPlugin(opts),
            ],
        });

        const publicDir: string = Path.resolve(
            getDistDir(BASE_DIR, "copy"),
            "public",
        );

        expect(Fs.existsSync(publicDir)).toBe(false);
    }, 30000);
});
