import puppeteer, { HTTPRequest, HTTPResponse, Page } from "puppeteer";
import { fetchSchedule } from "./db";
import { generateIcal } from "./ical";
import { httpServer } from "./server";
import { fetchDates } from "./optisport";

let server = new httpServer(3000);

server.addHandler(".*", (req, res) => {
    console.log(req.url);
    fetchDates();
});

server.addRoute("/", (req, res) => {
    // res.end();
});

server.addRoute("/ical", (req, res) => {
    generateIcal().then((ical) => {
        res.end(ical.toString());
    });
});

server.addRoute("/json", (req, res) => {
    fetchSchedule().then((result: CombinedEvent[]) => {
        if (server.currentUrl?.searchParams.get("pretty") !== null) {
            res.end(JSON.stringify(result, null, 4));
        } else {
            res.end(JSON.stringify(result));
        }
    });
});
