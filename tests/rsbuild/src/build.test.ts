import type { RsbuildInstance } from "@rsbuild/core";
import type { ResolvedOptions } from "@srvkit/common";

import * as Fs from "node:fs";
import { builtinModules } from "node:module";
import * as Path from "node:path";

import { createRsbuild } from "@rsbuild/core";
import { resolveOptions } from "@srvkit/common";
import { buildPlugin } from "@srvkit/rsbuild/plugins/build";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BASE_DIR } from "#/constants/path";
import { cleanupFixture, createFixture, getDistDir } from "#/helpers/fixture";

const hasExportDefault = (content: string): boolean => {
    return /export\s+default\s|export\s*\{[^}]*as\s+default\s*\}/.test(content);
};

const assertNoThirdPartyRequires = (content: string): void => {
    const matches: IterableIterator<RegExpMatchArray> = content.matchAll(
        /require\(["']([^"']+)["']\)/g,
    );

    for (const match of matches) {
        const moduleId: string | undefined = match[1];

        if (moduleId === void 0) continue;

        const isBuiltin: boolean =
            builtinModules.includes(moduleId) ||
            moduleId.startsWith("node:") ||
            moduleId.startsWith("./") ||
            moduleId.startsWith("../");

        expect(isBuiltin).toBe(true);
    }
};

describe("rsbuild build plugin", (): void => {
    describe("target: server", (): void => {
        let tempDir: string;

        beforeAll((): void => {
            tempDir = createFixture(BASE_DIR, "build-server");
        });

        afterAll((): void => {
            cleanupFixture(BASE_DIR, "build-server");
        });

        it("bundle: external — produces self-starting server output", async (): Promise<void> => {
            const opts: ResolvedOptions = resolveOptions({
                cwd: tempDir,
                entry: "./src/index.ts",
                build: {
                    target: "server",
                    bundle: "external",
                },
            });

            const rsbuild: RsbuildInstance = await createRsbuild({
                cwd: tempDir,
                rsbuildConfig: {
                    plugins: [
                        buildPlugin(opts),
                    ],
                    logLevel: "silent",
                },
            });

            await rsbuild.build();

            const outputFile: string = Path.resolve(
                getDistDir(BASE_DIR, "build-server"),
                "index.js",
            );

            expect(Fs.existsSync(outputFile)).toBe(true);

            const content: string = Fs.readFileSync(outputFile, "utf-8");

            expect(content.length).toBeGreaterThan(0);
        }, 15000);

        it("bundle: standalone — produces output with all deps inlined", async (): Promise<void> => {
            const opts: ResolvedOptions = resolveOptions({
                cwd: tempDir,
                entry: "./src/index.ts",
                build: {
                    target: "server",
                    bundle: "standalone",
                },
            });

            const rsbuild: RsbuildInstance = await createRsbuild({
                cwd: tempDir,
                rsbuildConfig: {
                    plugins: [
                        buildPlugin(opts),
                    ],
                    logLevel: "silent",
                },
            });

            await rsbuild.build();

            const outputFile: string = Path.resolve(
                getDistDir(BASE_DIR, "build-server"),
                "index.js",
            );

            expect(Fs.existsSync(outputFile)).toBe(true);

            const content: string = Fs.readFileSync(outputFile, "utf-8");

            expect(content.length).toBeGreaterThan(0);

            assertNoThirdPartyRequires(content);
        }, 15000);
    });

    describe("target: handler", (): void => {
        let tempDir: string;

        beforeAll((): void => {
            tempDir = createFixture(BASE_DIR, "build-handler");
        });

        afterAll((): void => {
            cleanupFixture(BASE_DIR, "build-handler");
        });

        it("bundle: external — produces handler with export default", async (): Promise<void> => {
            const opts: ResolvedOptions = resolveOptions({
                cwd: tempDir,
                entry: "./src/index.ts",
                build: {
                    target: "handler",
                    bundle: "external",
                },
            });

            const rsbuild: RsbuildInstance = await createRsbuild({
                cwd: tempDir,
                rsbuildConfig: {
                    plugins: [
                        buildPlugin(opts),
                    ],
                    logLevel: "silent",
                },
            });

            await rsbuild.build();

            const outputFile: string = Path.resolve(
                getDistDir(BASE_DIR, "build-handler"),
                "index.js",
            );

            expect(Fs.existsSync(outputFile)).toBe(true);

            const content: string = Fs.readFileSync(outputFile, "utf-8");

            expect(content.length).toBeGreaterThan(0);
            expect(hasExportDefault(content)).toBe(true);
        }, 15000);

        it("bundle: standalone — produces handler with export default and all deps inlined", async (): Promise<void> => {
            const opts: ResolvedOptions = resolveOptions({
                cwd: tempDir,
                entry: "./src/index.ts",
                build: {
                    target: "handler",
                    bundle: "standalone",
                },
            });

            const rsbuild: RsbuildInstance = await createRsbuild({
                cwd: tempDir,
                rsbuildConfig: {
                    plugins: [
                        buildPlugin(opts),
                    ],
                    logLevel: "silent",
                },
            });

            await rsbuild.build();

            const outputFile: string = Path.resolve(
                getDistDir(BASE_DIR, "build-handler"),
                "index.js",
            );

            expect(Fs.existsSync(outputFile)).toBe(true);

            const content: string = Fs.readFileSync(outputFile, "utf-8");

            expect(content.length).toBeGreaterThan(0);
            expect(hasExportDefault(content)).toBe(true);

            assertNoThirdPartyRequires(content);
        }, 15000);
    });
});
