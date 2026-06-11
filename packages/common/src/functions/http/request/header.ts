import type HTTP from "node:http";

const toHeaders = (headers: HTTP.IncomingHttpHeaders): Headers => {
    const result: Headers = new Headers();

    const entries: [
        string,
        string | string[] | undefined,
    ][] = Object.entries(headers);

    for (let i: number = 0; i < entries.length; i++) {
        const entry:
            | [
                  string,
                  string | string[] | undefined,
              ]
            | undefined = entries[i];

        if (entry === void 0) continue;

        const [key, value] = entry;

        // Skip HTTP/2 pseudo-headers (:method, :path, :authority, etc.)
        // which must not be forwarded to the Request/Response Headers object
        if (key.startsWith(":")) continue;

        if (value === void 0) continue;

        if (Array.isArray(value)) {
            for (let j: number = 0; j < value.length; j++) {
                const vl: string | undefined = value[j];

                if (vl === void 0) continue;

                result.append(key, vl);
            }
        } else {
            result.set(key, value);
        }
    }

    return result;
};

export { toHeaders };
