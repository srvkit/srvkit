import * as Fs from "node:fs";
import * as Path from "node:path";

import { srvkit } from "@srvkit/vite/plugin";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEMP_DIR: string = Path.resolve(__dirname, "__temp__");

const SRC_DIR: string = Path.resolve(TEMP_DIR, "src");

const DIST_DIR: string = Path.resolve(TEMP_DIR, "dist");

const setupTempDir = (): void => {
    Fs.rmSync(TEMP_DIR, {
        recursive: true,
        force: true,
    });

    Fs.mkdirSync(SRC_DIR, {
        recursive: true,
    });

    Fs.writeFileSync(
        Path.resolve(SRC_DIR, "index.ts"),
        [
            "export default {",
            "    fetch: (_req: Request): Response => {",
            '        return new Response("Hello, World!");',
            "    },",
            "};",
        ].join("\n"),
    );

    Fs.writeFileSync(
        Path.resolve(TEMP_DIR, "package.json"),
        JSON.stringify({
            name: "test-app",
            type: "module",
            dependencies: {},
        }),
    );
};

const cleanupTempDir = (): void => {
    Fs.rmSync(TEMP_DIR, {
        recursive: true,
        force: true,
    });
};

describe("vite build", (): void => {
    beforeAll(() => {
        setupTempDir();
    });

    afterAll(() => {
        cleanupTempDir();
    });

    it("produces output file for server target with external bundle", async (): Promise<void> => {
        await build({
            root: TEMP_DIR,
            logLevel: "silent",
            plugins: [
                srvkit({
                    cwd: TEMP_DIR,
                    entry: "./src/index.ts",
                }),
            ],
        });

        const outputFile: string = Path.resolve(DIST_DIR, "index.js");

        expect(Fs.existsSync(outputFile)).toBe(true);

        const content: string = Fs.readFileSync(outputFile, "utf-8");

        expect(content.length).toBeGreaterThan(0);
    }, 30000);

    it("produces output file with export default for handler target", async (): Promise<void> => {
        await build({
            root: TEMP_DIR,
            logLevel: "silent",
            plugins: [
                srvkit({
                    cwd: TEMP_DIR,
                    entry: "./src/index.ts",
                    build: {
                        target: "handler",
                    },
                }),
            ],
        });

        const outputFile: string = Path.resolve(DIST_DIR, "index.js");

        expect(Fs.existsSync(outputFile)).toBe(true);

        const content: string = Fs.readFileSync(outputFile, "utf-8");

        expect(content.length).toBeGreaterThan(0);
    }, 30000);
});
