import type {
    ResolvedBuildServerOptions,
    ResolvedOptions,
} from "@srvkit/common";

import * as Path from "node:path";

import { createVirtualEntryCode } from "@srvkit/common";
import { describe, expect, it } from "vitest";

const FIXTURE_DIR: string = Path.resolve(__dirname, "__fixtures__");

const BASE_OPTIONS: ResolvedOptions = {
    cwd: FIXTURE_DIR,
    entry: Path.resolve(FIXTURE_DIR, "./src/index.ts"),
    runtime: "node",
    dev: {
        host: "localhost",
        port: 3001,
    },
    build: {
        target: "server",
        host: "localhost",
        port: 3000,
        bundle: "external",
        outputDir: "./dist",
        outputFile: "index.js",
        minify: false,
        publicDir: "./public",
        copyPublicDir: false,
    },
    verbose: false,
};

describe("createVirtualEntryCode", (): void => {
    it("generates server code with default host and port", (): void => {
        const code: string = createVirtualEntryCode({
            ...BASE_OPTIONS,
            packageName: "@srvkit/vite",
        });

        expect(code).toContain('import options from "');
        expect(code).toContain('import { serve } from "@srvkit/vite/runtime";');
        expect(code).toContain("serve({");
        expect(code).toContain("...options,");
        expect(code).not.toContain("hostname:");
        expect(code).not.toContain("port:");
        expect(code).toContain("});");
    });

    it("includes hostname when host is not localhost", (): void => {
        const build: ResolvedBuildServerOptions = {
            ...(BASE_OPTIONS.build as ResolvedBuildServerOptions),
            host: "0.0.0.0",
        };

        const code: string = createVirtualEntryCode({
            ...BASE_OPTIONS,
            build,
            packageName: "@srvkit/vite",
        });

        expect(code).toContain('hostname: "0.0.0.0",');
    });

    it("includes port when port is not 3000", (): void => {
        const build: ResolvedBuildServerOptions = {
            ...(BASE_OPTIONS.build as ResolvedBuildServerOptions),
            port: 8080,
        };

        const code: string = createVirtualEntryCode({
            ...BASE_OPTIONS,
            build,
            packageName: "@srvkit/vite",
        });

        expect(code).toContain("port: 8080,");
    });

    it("includes tls options when https is configured", (): void => {
        const build: ResolvedBuildServerOptions = {
            ...(BASE_OPTIONS.build as ResolvedBuildServerOptions),
            https: {
                cert: "/path/to/cert.pem",
                key: "/path/to/key.pem",
                passphrase: "secret",
            },
        };

        const code: string = createVirtualEntryCode({
            ...BASE_OPTIONS,
            build,
            packageName: "@srvkit/vite",
        });

        expect(code).toContain("tls: {");
        expect(code).toContain('cert: "/path/to/cert.pem",');
        expect(code).toContain('key: "/path/to/key.pem",');
        expect(code).toContain('passphrase: "secret",');
        expect(code).toContain("},");
    });

    it("generates handler code with manual and export default", (): void => {
        const code: string = createVirtualEntryCode({
            ...BASE_OPTIONS,
            build: {
                target: "handler",
                bundle: "external",
                outputDir: "./dist",
                outputFile: "index.js",
                minify: false,
            },
            packageName: "@srvkit/rsbuild",
        });

        expect(code).toContain(
            "const server = serve({ ...options, manual: true });",
        );
        expect(code).toContain("export default server;");
        expect(code).not.toContain("hostname:");
        expect(code).not.toContain("port:");
    });
});
