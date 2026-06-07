import * as Http from "node:http";

type FetchLocalOptions = {
    port: number;
    path?: string;
    host?: string;
    method?: string;
    body?: string;
};

type FetchLocalResult = {
    status: number;
    headers: Headers;
    body: string;
};

const fetchLocal = (options: FetchLocalOptions): Promise<FetchLocalResult> => {
    const host: string = options.host ?? "localhost";
    const path: string = options.path ?? "/";
    const method: string = options.method ?? "GET";

    return new Promise((resolve, reject) => {
        const request: Http.ClientRequest = Http.request(
            {
                host,
                port: options.port,
                path,
                method,
            },
            (response: Http.IncomingMessage) => {
                const chunks: Uint8Array[] = [];

                response.on("data", (chunk: Uint8Array) => {
                    chunks.push(chunk);
                });

                response.on("end", () => {
                    const body: string =
                        Buffer.concat(chunks).toString("utf-8");

                    const headers: Headers = new Headers();

                    for (const [key, value] of Object.entries(
                        response.headers,
                    )) {
                        if (value === void 0) continue;

                        if (Array.isArray(value)) {
                            for (const v of value) {
                                headers.append(key, v);
                            }
                        } else {
                            headers.append(key, value);
                        }
                    }

                    resolve({
                        status: response.statusCode ?? 0,
                        headers,
                        body,
                    });
                });

                response.on("error", reject);
            },
        );

        request.on("error", reject);

        if (options.body !== void 0) {
            request.write(options.body);
        }

        request.end();
    });
};

export type { FetchLocalOptions, FetchLocalResult };
export { fetchLocal };
