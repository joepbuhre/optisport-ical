import http from "node:http";
import { logger } from "./logger";

// export class httpServer = (server: http.Server) => {

// }

export class httpServer {
    private port: number;
    private server: http.Server;
    public currentUrl: URL | undefined;

    constructor(port: number) {
        this.port = port;
        this.server = http
            .createServer((req, res) => {})
            .listen(3000, "0.0.0.0", () => {
                logger.info(`Server running on :${port}`);
            });
        this.server.on("request", (req, res) => {
            this.currentUrl = new URL("http:" + (req.headers.host ?? "") + (req.url ?? ""));
        });
    }

    private checkUrl = (url: string, test: string | RegExp) => {
        if (typeof test === "string") {
            return url === test;
        } else {
            return new RegExp(test).test(url) === true;
        }
    };

    public addRoute = (
        path: string | RegExp,
        handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
    ) => {
        this.server.on("request", (req, res) => {
            if (
                req.url !== undefined &&
                res.writableEnded === false &&
                this.checkUrl(req.url, path)
            ) {
                handler(req, res);
            }
        });
    };
}
