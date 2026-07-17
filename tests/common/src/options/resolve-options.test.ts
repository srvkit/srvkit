import type {
    ResolvedBuildServerOptions,
    ResolvedOptions,
} from "@srvkit/common/@types/options/resolved";

import * as Path from "node:path";

import { resolveOptions } from "@srvkit/common/functions/options/resolve";
import { describe, expect, it } from "vitest";

const FIXTURE_DIR: string = Path.resolve(__dirname, "..", "__fixtures__");

describe("resolveOptions", (): void => {
    it("applies default values for server target", (): void => {
        const result = resolveOptions({
            cwd: FIXTURE_DIR,
            entry: "./src/index.ts",
        });

        const build = result.build as ResolvedBuildServerOptions;

        expect(result.runtime).toBe("node");
        expect(result.dev.host).toBe("localhost");
        expect(result.dev.port).toBe(3001);
        expect(result.verbose).toBe(false);
        expect(build.target).toBe("server");
        expect(build.host).toBe("localhost");
        expect(build.port).toBe(3000);
        expect(build.bundle).toBe("external");
        expect(build.outputDir).toBe("./dist");
        expect(build.outputFile).toBe("index.js");
        expect(build.minify).toBe(false);
        expect(build.public.from).toBe("./public");
        expect(build.public.copy).toBe(false);
        expect(build.public.to).toBeUndefined();
    });

    it("applies handler defaults when build.target is handler", (): void => {
        const result: ResolvedOptions = resolveOptions({
            cwd: FIXTURE_DIR,
            entry: "./src/index.ts",
            build: {
                target: "handler",
            },
        });

        expect(result.build.target).toBe("handler");
        expect(result.build.bundle).toBe("external");
        expect(result.build.outputDir).toBe("./dist");
        expect(result.build.outputFile).toBe("index.js");
        expect(result.build.minify).toBe(false);
        expect(result.build.public.from).toBe("./public");
        expect(result.build.public.copy).toBe(false);
        expect("host" in result.build).toBe(false);
        expect("port" in result.build).toBe(false);
    });

    it("merges partial options with defaults", (): void => {
        const result: ResolvedOptions = resolveOptions({
            cwd: FIXTURE_DIR,
            entry: "./src/index.ts",
            runtime: "bun",
            dev: {
                port: 4000,
            },
        });

        expect(result.runtime).toBe("bun");
        expect(result.dev.host).toBe("localhost");
        expect(result.dev.port).toBe(4000);
    });

    it("resolves entry path from cwd", (): void => {
        const result: ResolvedOptions = resolveOptions({
            cwd: FIXTURE_DIR,
            entry: "./src/index.ts",
        });

        expect(result.entry).toBe(Path.resolve(FIXTURE_DIR, "./src/index.ts"));
    });

    it("auto-detects entry file when not provided", (): void => {
        const result: ResolvedOptions = resolveOptions({
            cwd: FIXTURE_DIR,
        });

        expect(result.entry).toBe(Path.resolve(FIXTURE_DIR, "./src/index.ts"));
    });

    it("throws when no entry file is found", (): void => {
        expect(
            (): ResolvedOptions =>
                resolveOptions({
                    cwd: Path.resolve(__dirname),
                }),
        ).toThrow("No entry file found");
    });
});
