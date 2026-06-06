import * as Path from "node:path";

import { toPosix } from "@srvkit/common";
import { describe, expect, it } from "vitest";

describe("toPosix", (): void => {
    it("keeps posix paths unchanged", (): void => {
        const result: string = toPosix("/foo/bar/baz");

        expect(result).toBe("/foo/bar/baz");
    });

    it("replaces platform separator with posix separator", (): void => {
        const input: string = [
            "foo",
            "bar",
            "baz",
        ].join(Path.sep);

        const result: string = toPosix(input);

        expect(result).toBe("foo/bar/baz");
    });

    it("returns relative posix path as-is on posix platforms", (): void => {
        const result: string = toPosix("foo/bar/baz");

        expect(result).toBe("foo/bar/baz");
    });
});
