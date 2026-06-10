import type { PackageJson } from "@srvkit/common/functions/package/package-json";

import * as Path from "node:path";

import { getPackageJson } from "@srvkit/common/functions/package/package-json";
import { describe, expect, it } from "vitest";

const FIXTURE_DIR: string = Path.resolve(__dirname, "..", "__fixtures__");

describe("getPackageJson", (): void => {
    it("reads and parses a package.json", (): void => {
        const result: PackageJson = getPackageJson(FIXTURE_DIR);

        expect(result).toBeDefined();
        expect(result.type).toBe("module");
        expect(result.dependencies).toBeDefined();
    });

    it("throws when package.json does not exist", (): void => {
        expect(
            (): PackageJson =>
                getPackageJson(Path.resolve(__dirname, "__nonexistent__")),
        ).toThrow("Failed to find package.json");
    });
});
