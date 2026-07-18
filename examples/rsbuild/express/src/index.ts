import type { Express, Request, Response } from "express";

import { defineServer } from "@srvkit/rsbuild";
import { toFetchHandler } from "@srvkit/rsbuild/node";
import express from "express";

const app: Express = express();

app.get("/", (_: Request, res: Response): void => {
    res.json({
        success: true,
    });
});

app.get("/data", (_: Request, res: Response): void => {
    res.json({
        success: true,
        data: {
            message: "Hello, World!",
        },
    });
});

export default defineServer({
    fetch: toFetchHandler(app),
});
