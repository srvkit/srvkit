import type { RsbuildInstance } from "@rsbuild/core";
import type { ResolvedOptions } from "@srvkit/common";

import * as Fs from "node:fs";
import * as Path from "node:path";

import { createRsbuild } from "@rsbuild/core";
import { resolveOptions } from "@srvkit/common";
import { buildPlugin } from "@srvkit/rsbuild/plugins/build";
import { copyPlugin } from "@srvkit/rsbuild/plugins/copy";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getDistDir } from "#/helpers/fixture";

describe("rsbuild copy plugin", (): void => {
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
        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "server",
                copyPublicDir: true,
            },
        });

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    buildPlugin(opts),
                    ...copyPlugin(opts),
                ],
            },
        });

        await rsbuild.build();

        const outputFile: string = Path.resolve(
            getDistDir(BASE_DIR, "copy"),
            "public",
            "hello.txt",
        );

        expect(Fs.existsSync(outputFile)).toBe(true);

        const content: string = Fs.readFileSync(outputFile, "utf-8");

        expect(content).toBe("Hello from public!");
    }, 60000);

    it("does not copy when copyPublicDir is false", async (): Promise<void> => {
        const opts: ResolvedOptions = resolveOptions({
            cwd: tempDir,
            entry: "./src/index.ts",
            build: {
                target: "server",
                copyPublicDir: false,
            },
        });

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    buildPlugin(opts),
                    ...copyPlugin(opts),
                ],
            },
        });

        await rsbuild.build();

        const publicDir: string = Path.resolve(
            getDistDir(BASE_DIR, "copy"),
            "public",
        );

        expect(Fs.existsSync(publicDir)).toBe(false);
    }, 60000);

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

        const rsbuild: RsbuildInstance = await createRsbuild({
            cwd: tempDir,
            rsbuildConfig: {
                plugins: [
                    buildPlugin(opts),
                    ...copyPlugin(opts),
                ],
            },
        });

        await rsbuild.build();

        const publicDir: string = Path.resolve(
            getDistDir(BASE_DIR, "copy"),
            "public",
        );

        expect(Fs.existsSync(publicDir)).toBe(false);
    }, 60000);
});
