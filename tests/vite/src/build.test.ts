import type { ResolvedOptions } from "@srvkit/common/@types/options/resolved";

import * as Fs from "node:fs";
import { builtinModules } from "node:module";
import * as Path from "node:path";

import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { buildPlugin } from "@srvkit/vite/plugins/build";
import { copyPlugin } from "@srvkit/vite/plugins/copy";
import { build } from "vite";
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

const assertHasThirdPartyImport = (content: string, moduleId: string): void => {
    const pattern: RegExp = new RegExp(
        `import.*from\\s+["']${moduleId.replace("/", "\\/")}["']`,
    );
    expect(
        pattern.test(content) || content.includes(`require("${moduleId}")`),
    ).toBe(true);
};

describe("vite build plugin", (): void => {
    describe("config override", (): void => {
        let tempDir: string;

        beforeAll((): void => {
            tempDir = createFixture(BASE_DIR, "build-override", {
                entryContent: [
                    'import { greet } from "fake-dep";',
                    "",
                    "export default {",
                    "    fetch: (_req: Request): Response => {",
                    "        return new Response(greet());",
                    "    },",
                    "};",
                ].join("\n"),
                publicFiles: {
                    "hello.txt": "Hello from public!",
                },
                localDependencies: {
                    "fake-dep": {
                        "index.js":
                            'export const greet = () => "Hello from fake-dep!";',
                    },
                },
            });
        });

        afterAll((): void => {
            cleanupFixture(BASE_DIR, "build-override");
        });

        it("build.ssr: true overrides user's build.ssr: false — output is ESM", async (): Promise<void> => {
            const opts: ResolvedOptions = resolveOptions({
                cwd: tempDir,
                entry: "./src/index.ts",
                build: {
                    target: "server",
                    bundle: "external",
                },
            });

            await build({
                root: tempDir,
                plugins: [
                    buildPlugin(opts),
                ],
                logLevel: "silent",
                build: {
                    ssr: false,
                },
            });

            const outputFile: string = Path.resolve(
                getDistDir(BASE_DIR, "build-override"),
                "index.js",
            );

            expect(Fs.existsSync(outputFile)).toBe(true);

            const content: string = Fs.readFileSync(outputFile, "utf-8");

            expect(content.length).toBeGreaterThan(0);
            expect(content.startsWith("import ")).toBe(true);
        }, 15000);

        it("copyPublicDir: false overrides user's copyPublicDir: true — public dir not in dist", async (): Promise<void> => {
            const distDir: string = Path.resolve(
                getDistDir(BASE_DIR, "build-override"),
            );

            const opts: ResolvedOptions = resolveOptions({
                cwd: tempDir,
                entry: "./src/index.ts",
                build: {
                    target: "server",
                    bundle: "external",
                    outputDir: distDir,
                },
            });

            await build({
                root: tempDir,
                plugins: [
                    buildPlugin(opts),
                    ...copyPlugin(opts),
                ],
                logLevel: "silent",
                build: {
                    copyPublicDir: true,
                },
            });

            const publicDir: string = Path.resolve(distDir, "public");

            expect(Fs.existsSync(publicDir)).toBe(false);
        }, 15000);

        it("ssr.external: true overrides user's ssr.noExternal: true — deps are externalized", async (): Promise<void> => {
            const opts: ResolvedOptions = resolveOptions({
                cwd: tempDir,
                entry: "./src/index.ts",
                build: {
                    target: "server",
                    bundle: "external",
                },
            });

            await build({
                root: tempDir,
                plugins: [
                    buildPlugin(opts),
                ],
                logLevel: "silent",
                ssr: {
                    noExternal: true,
                },
            });

            const outputFile: string = Path.resolve(
                getDistDir(BASE_DIR, "build-override"),
                "index.js",
            );

            expect(Fs.existsSync(outputFile)).toBe(true);

            const content: string = Fs.readFileSync(outputFile, "utf-8");

            expect(content.length).toBeGreaterThan(0);
            assertHasThirdPartyImport(content, "fake-dep");
        }, 15000);
    });

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

            await build({
                root: tempDir,
                plugins: [
                    buildPlugin(opts),
                ],
                logLevel: "silent",
            });

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

            await build({
                root: tempDir,
                plugins: [
                    buildPlugin(opts),
                ],
                logLevel: "silent",
            });

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

            await build({
                root: tempDir,
                plugins: [
                    buildPlugin(opts),
                ],
                logLevel: "silent",
            });

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

            await build({
                root: tempDir,
                plugins: [
                    buildPlugin(opts),
                ],
                logLevel: "silent",
            });

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
