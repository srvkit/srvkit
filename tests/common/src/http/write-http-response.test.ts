import type HTTP from "node:http";

import { writeHttpResponse } from "@srvkit/common";
import { describe, expect, it, vi } from "vitest";

const createMockResponse = (): HTTP.ServerResponse => {
    const headers: Record<string, string> = {};
    const chunks: Uint8Array[] = [];
    let ended: boolean = false;

    const mock: unknown = {
        statusCode: 200,
        setHeader: vi.fn((key: string, value: string): void => {
            headers[key] = value;
        }),
        write: vi.fn((chunk: Uint8Array): boolean => {
            chunks.push(chunk);
            return true;
        }),
        end: vi.fn((): void => {
            ended = true;
        }),
        getHeaders: (): Record<string, string> => headers,
        getChunks: (): Uint8Array[] => chunks,
        isEnded: (): boolean => ended,
    };

    return mock as HTTP.ServerResponse;
};

describe("writeHttpResponse", (): void => {
    it("sets status code and calls end for null body", async (): Promise<void> => {
        const httpResponse: HTTP.ServerResponse = createMockResponse();

        const response: Response = new Response(null, {
            status: 204,
        });

        await writeHttpResponse({
            response,
            httpResponse,
        });

        expect(httpResponse.statusCode).toBe(204);
        expect(httpResponse.end).toHaveBeenCalled();
        expect(httpResponse.write).not.toHaveBeenCalled();
    });

    it("sets all response headers", async (): Promise<void> => {
        const httpResponse: HTTP.ServerResponse = createMockResponse();

        const response: Response = new Response("body", {
            status: 200,
            headers: {
                "content-type": "text/plain",
                "x-custom": "value",
            },
        });

        await writeHttpResponse({
            response,
            httpResponse,
        });

        expect(httpResponse.setHeader).toHaveBeenCalledWith(
            "content-type",
            "text/plain",
        );
        expect(httpResponse.setHeader).toHaveBeenCalledWith(
            "x-custom",
            "value",
        );
    });

    it("writes body chunks and calls end", async (): Promise<void> => {
        const httpResponse: HTTP.ServerResponse = createMockResponse();

        const body: string = "Hello, World!";

        const response: Response = new Response(body, {
            headers: {
                "content-type": "text/plain",
            },
        });

        await writeHttpResponse({
            response,
            httpResponse,
        });

        expect(httpResponse.write).toHaveBeenCalled();
        expect(httpResponse.end).toHaveBeenCalled();
    });
});
