import { toHeaders } from "@srvkit/common";
import { describe, expect, it } from "vitest";

describe("toHeaders", (): void => {
    it("converts simple key-value headers", (): void => {
        const headers: Record<string, string> = {
            "content-type": "text/html",
            "x-custom": "value",
        };

        const result: Headers = toHeaders(headers);

        expect(result.get("content-type")).toBe("text/html");
        expect(result.get("x-custom")).toBe("value");
    });

    it("appends all values for array headers", (): void => {
        const headers: Record<string, string | string[]> = {
            "set-cookie": [
                "a=1",
                "b=2",
            ],
        };

        const result: Headers = toHeaders(headers);

        const values: string[] = result.getSetCookie?.() ?? [
            result.get("set-cookie") ?? "",
        ];

        expect(values).toHaveLength(2);
        expect(values).toContain("a=1");
        expect(values).toContain("b=2");
    });

    it("skips HTTP/2 pseudo-headers", (): void => {
        const headers: Record<string, string | undefined> = {
            ":method": "GET",
            ":path": "/",
            ":authority": "localhost",
            ":scheme": "https",
            "content-type": "text/plain",
        };

        const result: Headers = toHeaders(headers);

        const keys: string[] = [
            ...result.keys(),
        ];

        expect(keys).not.toContain(":method");
        expect(keys).not.toContain(":path");
        expect(keys).not.toContain(":authority");
        expect(keys).not.toContain(":scheme");
        expect(result.get("content-type")).toBe("text/plain");
    });

    it("skips undefined values", (): void => {
        const headers: Record<string, string | undefined> = {
            host: "localhost",
            accept: undefined,
        };

        const result: Headers = toHeaders(headers);

        expect(result.get("host")).toBe("localhost");
        expect(result.get("accept")).toBeNull();
    });

    it("skips undefined items in array values", (): void => {
        const headers: Record<string, (string | undefined)[]> = {
            "x-multi": [
                "a",
                undefined,
                "b",
            ],
        };

        // @ts-expect-error
        const result: Headers = toHeaders(headers);

        expect(result.get("x-multi")).toBe("a, b");
    });

    it("returns empty headers for empty input", (): void => {
        const result: Headers = toHeaders({});

        expect([
            ...result.entries(),
        ]).toHaveLength(0);
    });
});
