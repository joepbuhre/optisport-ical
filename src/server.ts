import http from "node:http";

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
                console.log("Server running at http://127.0.0.1:3000/");
            });
        this.server.on("request", (req, res) => {
            this.currentUrl = new URL("http:" + (req.headers.host ?? "") + (req.url ?? ""));
        });
    }

    public addRoute = (
        path: string,
        handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
    ) => {
        this.server.on("request", (req, res) => {
            if (
                req.url !== undefined &&
                new RegExp(path).test(req.url) === true &&
                res.writableEnded === false
            ) {
                handler(req, res);
            }
        });
    };
    public addHandler = (
        path: string,
        handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
    ) => {
        this.server.on("request", (req, res) => {
            if (req.url !== undefined && new RegExp(path).test(req.url) === true) {
                handler(req, res);
            }
        });
    };
}
