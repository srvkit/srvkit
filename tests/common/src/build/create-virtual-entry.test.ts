import type {
    ResolvedBuildServerOptions,
    ResolvedOptions,
} from "@srvkit/common/@types/options/resolved";

import * as Path from "node:path";

import { createVirtualEntryCode } from "@srvkit/common/functions/build/virtual-entry";
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
        public: {
            from: "./public",
            copy: false,
        },
    },
    verbose: false,
};

describe("createVirtualEntryCode", (): void => {
    it("generates server code with default host and port", (): void => {
        const code: string = createVirtualEntryCode({
            packageName: "@srvkit/vite",
            resolvedOptions: BASE_OPTIONS,
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
            packageName: "@srvkit/vite",
            resolvedOptions: {
                ...BASE_OPTIONS,
                build,
            },
        });

        expect(code).toContain('hostname: "0.0.0.0",');
    });

    it("includes port when port is not 3000", (): void => {
        const build: ResolvedBuildServerOptions = {
            ...(BASE_OPTIONS.build as ResolvedBuildServerOptions),
            port: 8080,
        };

        const code: string = createVirtualEntryCode({
            packageName: "@srvkit/vite",
            resolvedOptions: {
                ...BASE_OPTIONS,
                build,
            },
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
            packageName: "@srvkit/vite",
            resolvedOptions: {
                ...BASE_OPTIONS,
                build,
            },
        });

        expect(code).toContain("tls: {");
        expect(code).toContain('cert: "/path/to/cert.pem",');
        expect(code).toContain('key: "/path/to/key.pem",');
        expect(code).toContain('passphrase: "secret",');
        expect(code).toContain("},");
    });

    it("generates handler code with manual and export default", (): void => {
        const code: string = createVirtualEntryCode({
            packageName: "@srvkit/rsbuild",
            resolvedOptions: {
                ...BASE_OPTIONS,
                build: {
                    target: "handler",
                    bundle: "external",
                    outputDir: "./dist",
                    outputFile: "index.js",
                    minify: false,
                    public: {
                        from: "./public",
                        copy: false,
                    },
                },
            },
        });

        expect(code).toContain(
            "const server = serve({ ...options, manual: true });",
        );
        expect(code).toContain("export default server;");
        expect(code).not.toContain("hostname:");
        expect(code).not.toContain("port:");
    });

    it("generates dev handler with createLiveServer and HMR", (): void => {
        const code: string = createVirtualEntryCode({
            dev: true,
            isCloudflare: true,
            packageName: "@srvkit/vite",
            resolvedOptions: {
                ...BASE_OPTIONS,
                build: {
                    target: "handler",
                    bundle: "external",
                    outputDir: "./dist",
                    outputFile: "index.js",
                    minify: false,
                    public: {
                        from: "./public",
                        copy: false,
                    },
                },
            },
        });

        expect(code).toContain(
            'import { createLiveServer } from "@srvkit/vite/dev-runtime";',
        );
        expect(code).toContain(
            "createLiveServer({ ...options, gracefulShutdown: false, manual: true })",
        );
        expect(code).toContain("export default server;");
        expect(code).toContain("if (import.meta.hot) {");
        expect(code).toContain("import.meta.hot.accept((mod) => {");
        expect(code).toContain("if (mod?.default) update(mod.default);");
        expect(code).not.toContain("const server = serve(");
    });

    it("generates handler code without HMR when dev is false", (): void => {
        const code: string = createVirtualEntryCode({
            dev: false,
            packageName: "@srvkit/vite",
            resolvedOptions: {
                ...BASE_OPTIONS,
                build: {
                    target: "handler",
                    bundle: "external",
                    outputDir: "./dist",
                    outputFile: "index.js",
                    minify: false,
                    public: {
                        from: "./public",
                        copy: false,
                    },
                },
            },
        });

        expect(code).toContain(
            "const server = serve({ ...options, manual: true });",
        );
        expect(code).toContain("export default server;");
        expect(code).not.toContain("createLiveServer");
        expect(code).not.toContain("import.meta.hot");
    });

    it("does not generate dev code for server target", (): void => {
        const code: string = createVirtualEntryCode({
            dev: true,
            packageName: "@srvkit/vite",
            resolvedOptions: BASE_OPTIONS,
        });

        expect(code).toContain('import { serve } from "@srvkit/vite/runtime";');
        expect(code).not.toContain("createLiveServer");
        expect(code).not.toContain("import.meta.hot");
    });

    it("includes cloudflare env import in handler dev code", (): void => {
        const code: string = createVirtualEntryCode({
            dev: true,
            isCloudflare: true,
            packageName: "@srvkit/vite",
            resolvedOptions: {
                ...BASE_OPTIONS,
                runtime: "workerd",
                build: {
                    target: "handler",
                    bundle: "external",
                    outputDir: "./dist",
                    outputFile: "index.js",
                    minify: false,
                    public: {
                        from: "./public",
                        copy: false,
                    },
                },
            },
        });

        expect(code).toContain('import { env } from "cloudflare:workers";');
        expect(code).toContain("createLiveServer");
    });
});
