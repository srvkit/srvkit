import type {
    ErrorHandler,
    ServerHandler,
    ServerMiddleware,
    ServerOptions,
    ServerRequest,
} from "srvx";

import type { Server } from "#/@types/server";

import { serve } from "srvx";

type CreateLiveServerOptions = ServerOptions;

type LiveServer = {
    server: Server<ServerHandler>;
    update: (options: ServerOptions) => void;
};

const createLiveServer = (options: CreateLiveServerOptions): LiveServer => {
    let currentFetch: ServerHandler = options.fetch;

    let currentError: ErrorHandler | undefined = options.error;

    let currentMiddleware: ServerMiddleware[] | undefined = options.middleware;

    const serverFetch: ServerHandler = (
        req: ServerRequest,
    ): Response | Promise<Response> => {
        return currentFetch(req);
    };

    const serverError: ErrorHandler = (
        err: unknown,
    ): Response | Promise<Response> => {
        if (currentError !== void 0) return currentError(err);
        return new Response("Internal Server Error", {
            status: 500,
        });
    };

    const serverMiddleware: ServerMiddleware[] = [
        (
            req: ServerRequest,
            next: () => Response | Promise<Response>,
        ): Response | Promise<Response> => {
            if (
                currentMiddleware === void 0 ||
                currentMiddleware.length === 0
            ) {
                return next();
            }

            const middlewareList: ServerMiddleware[] = currentMiddleware;

            let idx: number = 0;

            const run = async (): Promise<Response> => {
                if (idx >= middlewareList.length) {
                    return next();
                }

                const middleware: ServerMiddleware | undefined =
                    middlewareList[idx++];

                if (middleware === void 0) {
                    return next();
                }

                try {
                    return await middleware(req, run);
                } catch {
                    return next();
                }
            };

            return run();
        },
    ];

    return {
        server: serve({
            ...options,
            fetch: serverFetch,
            error: serverError,
            middleware: serverMiddleware,
        }),
        update: (newOptions: ServerOptions): void => {
            currentFetch = newOptions.fetch;
            currentError = newOptions.error;
            currentMiddleware = newOptions.middleware;
        },
    };
};

export type { CreateLiveServerOptions, LiveServer };
export { createLiveServer };
