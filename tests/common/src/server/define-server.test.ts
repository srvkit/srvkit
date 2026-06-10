import { defineServer } from "@srvkit/common/functions/server/define";
import { describe, expect, it } from "vitest";

describe("defineServer", (): void => {
    it("returns the same object reference", (): void => {
        const options = {
            fetch: (): Response => {
                return new Response("ok");
            },
        };

        const result = defineServer(options);

        expect(result).toBe(options);
    });

    it("preserves fetch handler", (): void => {
        const handler = (): Response => {
            return new Response("hello");
        };

        const result = defineServer({
            fetch: handler,
        });

        expect(result.fetch).toBe(handler);
    });
});
