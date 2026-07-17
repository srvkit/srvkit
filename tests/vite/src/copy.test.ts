import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { buildPlugin } from "@srvkit/vite/plugins/build";
import { copyPlugin } from "@srvkit/vite/plugins/copy";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getDistDir } from "#/helpers/fixture";

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

    it("copies public directory when target is server and public.copy is true", async (): Promise<void> => {
        const distDir: string = Path.resolve(getDistDir(BASE_DIR, "copy"));

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "server",
                outputDir: distDir,
                public: {
                    copy: true,
                },
            },
        });

        await build({
            root: tempDir,
            plugins: [
                buildPlugin(opts),
                ...copyPlugin(opts),
            ],
            logLevel: "silent",
        });

        expect(Fs.existsSync(distDir)).toBe(true);

        const outputFile: string = Path.resolve(distDir, "index.js");

        expect(Fs.existsSync(outputFile)).toBe(true);

        const publicFile: string = Path.resolve(distDir, "public", "hello.txt");

        expect(Fs.existsSync(publicFile)).toBe(true);

        const content: string = Fs.readFileSync(publicFile, "utf-8");

        expect(content).toBe("Hello from public!");
    }, 15000);

    it("does not copy when public.copy is false", async (): Promise<void> => {
        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "server",
                public: {
                    copy: false,
                },
            },
        });

        await build({
            root: tempDir,
            plugins: [
                buildPlugin(opts),
                ...copyPlugin(opts),
            ],
            logLevel: "silent",
        });

        const publicDir: string = Path.resolve(
            getDistDir(BASE_DIR, "copy"),
            "public",
        );

        expect(Fs.existsSync(publicDir)).toBe(false);
    }, 15000);

    it("copies public directory when target is handler and public.copy is true", async (): Promise<void> => {
        const distDir: string = Path.resolve(getDistDir(BASE_DIR, "copy"));

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "handler",
                outputDir: distDir,
                public: {
                    copy: true,
                },
            },
        });

        await build({
            root: tempDir,
            plugins: [
                buildPlugin(opts),
                ...copyPlugin(opts),
            ],
            logLevel: "silent",
        });

        expect(Fs.existsSync(distDir)).toBe(true);

        const publicDir: string = Path.resolve(distDir, "public");

        expect(Fs.existsSync(publicDir)).toBe(true);
    }, 15000);

    it("copies public directory to public.from name when public.to is omitted", async (): Promise<void> => {
        const assetsDir: string = Path.resolve(tempDir, "assets");

        Fs.mkdirSync(assetsDir, {
            recursive: true,
        });
        Fs.writeFileSync(
            Path.resolve(assetsDir, "hello.txt"),
            "Hello from assets!",
        );

        const distDir: string = Path.resolve(
            getDistDir(BASE_DIR, "copy-output-public-dir"),
        );

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "server",
                outputDir: distDir,
                public: {
                    from: "./assets",
                    copy: true,
                },
            },
        });

        await build({
            root: tempDir,
            plugins: [
                buildPlugin(opts),
                ...copyPlugin(opts),
            ],
            logLevel: "silent",
        });

        const assetsFile: string = Path.resolve(distDir, "assets", "hello.txt");

        expect(Fs.existsSync(assetsFile)).toBe(true);

        const content: string = Fs.readFileSync(assetsFile, "utf-8");

        expect(content).toBe("Hello from assets!");

        Fs.rmSync(distDir, {
            recursive: true,
            force: true,
        });
    }, 15000);

    it("copies public directory to public.to when specified", async (): Promise<void> => {
        const distDir: string = Path.resolve(getDistDir(BASE_DIR, "copy"));

        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "server",
                outputDir: distDir,
                public: {
                    copy: true,
                    to: "./static",
                },
            },
        });

        await build({
            root: tempDir,
            plugins: [
                buildPlugin(opts),
                ...copyPlugin(opts),
            ],
            logLevel: "silent",
        });

        const staticFile: string = Path.resolve(distDir, "static", "hello.txt");

        expect(Fs.existsSync(staticFile)).toBe(true);

        const content: string = Fs.readFileSync(staticFile, "utf-8");

        expect(content).toBe("Hello from public!");

        const publicDir: string = Path.resolve(distDir, "public");

        expect(Fs.existsSync(publicDir)).toBe(false);
    }, 15000);
});
