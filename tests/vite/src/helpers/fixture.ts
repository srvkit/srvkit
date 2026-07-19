import * as Fs from "node:fs";
import * as Path from "node:path";

type FixtureOptions = {
    type?: "module" | "commonjs";
    entryContent?: string;
    publicFiles?: Record<string, string>;
    dependencies?: Record<string, string>;
    localDependencies?: Record<string, Record<string, string>>;
    extraFiles?: Record<string, string>;
};

const DEFAULT_ENTRY: string = [
    "export default {",
    "    fetch: (_req: Request): Response => {",
    '        return new Response("Hello, World!");',
    "    },",
    "};",
].join("\n");

const createFixture = (
    baseDir: string,
    name: string,
    options?: FixtureOptions,
): string => {
    const type: "module" | "commonjs" = options?.type ?? "module";
    const entryContent: string = options?.entryContent ?? DEFAULT_ENTRY;
    const publicFiles: Record<string, string> = options?.publicFiles ?? {};
    const dependencies: Record<string, string> = options?.dependencies ?? {};
    const localDependencies: Record<
        string,
        Record<string, string>
    > = options?.localDependencies ?? {};
    const extraFiles: Record<string, string> = options?.extraFiles ?? {};

    const tempDir: string = Path.resolve(baseDir, "__temp__", name);
    const srcDir: string = Path.resolve(tempDir, "src");
    const publicDir: string = Path.resolve(tempDir, "public");

    Fs.rmSync(tempDir, {
        recursive: true,
        force: true,
    });

    Fs.mkdirSync(srcDir, {
        recursive: true,
    });

    Fs.writeFileSync(Path.resolve(srcDir, "index.ts"), entryContent);

    Fs.writeFileSync(
        Path.resolve(tempDir, "package.json"),
        JSON.stringify({
            name: "test-app",
            type: type !== "commonjs" ? type : void 0,
            dependencies,
        }),
    );

    if (Object.keys(publicFiles).length > 0) {
        Fs.mkdirSync(publicDir, {
            recursive: true,
        });

        for (const [fileName, content] of Object.entries(publicFiles)) {
            Fs.writeFileSync(Path.resolve(publicDir, fileName), content);
        }
    }

    if (Object.keys(localDependencies).length > 0) {
        const nodeModulesDir: string = Path.resolve(tempDir, "node_modules");

        Fs.mkdirSync(nodeModulesDir, {
            recursive: true,
        });

        for (const [pkgName, files] of Object.entries(localDependencies)) {
            const pkgDir: string = Path.resolve(nodeModulesDir, pkgName);

            Fs.mkdirSync(pkgDir, {
                recursive: true,
            });

            Fs.writeFileSync(
                Path.resolve(pkgDir, "package.json"),
                JSON.stringify({
                    name: pkgName,
                    type: "module",
                    main: "index.js",
                }),
            );

            for (const [fileName, fileContent] of Object.entries(files)) {
                Fs.writeFileSync(Path.resolve(pkgDir, fileName), fileContent);
            }
        }
    }

    for (const [filePath, fileContent] of Object.entries(extraFiles)) {
        const resolvedPath: string = Path.resolve(tempDir, filePath);
        const parentDir: string = Path.dirname(resolvedPath);

        Fs.mkdirSync(parentDir, {
            recursive: true,
        });

        Fs.writeFileSync(resolvedPath, fileContent);
    }

    return tempDir;
};

const cleanupFixture = (baseDir: string, name: string): void => {
    const tempDir: string = Path.resolve(baseDir, "__temp__", name);

    Fs.rmSync(tempDir, {
        recursive: true,
        force: true,
    });
};

const getTempDir = (baseDir: string, name: string): string => {
    return Path.resolve(baseDir, "__temp__", name);
};

const getSrcDir = (baseDir: string, name: string): string => {
    return Path.resolve(baseDir, "__temp__", name, "src");
};

const getDistDir = (baseDir: string, name: string): string => {
    return Path.resolve(baseDir, "__temp__", name, "dist");
};

const getPublicDir = (baseDir: string, name: string): string => {
    return Path.resolve(baseDir, "__temp__", name, "public");
};

export {
    cleanupFixture,
    createFixture,
    getDistDir,
    getPublicDir,
    getSrcDir,
    getTempDir,
};
