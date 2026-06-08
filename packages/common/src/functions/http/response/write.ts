import type HTTP from "node:http";

type WriteHttpResponseOptions = {
    response: Response;
    httpResponse: HTTP.ServerResponse;
};

const writeHttpResponse = async ({
    response,
    httpResponse,
}: WriteHttpResponseOptions): Promise<void> => {
    httpResponse.statusCode = response.status;

    response.headers.forEach((value: string, key: string): void => {
        httpResponse.setHeader(key, value);
    });

    if (!response.body) {
        httpResponse.end();
        return void 0;
    }

    const reader: ReadableStreamDefaultReader<Uint8Array> =
        response.body.getReader();

    const drain = (): Promise<void> => {
        return new Promise<void>((resolve): void => {
            httpResponse.once("drain", resolve);
        });
    };

    const stream = async (): Promise<void> => {
        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                // write and check if internal buffer is full
                const isBufferFull: boolean = !httpResponse.write(value);

                if (isBufferFull) await drain();
            }

            httpResponse.end();
        } catch {
            httpResponse.end();
        }
    };

    await stream();
};

export type { WriteHttpResponseOptions };
export { writeHttpResponse };
