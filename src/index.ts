import puppeteer, { HTTPRequest, HTTPResponse, Page } from "puppeteer";
import { fetchSchedule } from "./db";
import { generateIcal } from "./ical";
import { httpServer } from "./server";
import { fetchDates } from "./optisport";
import fs from "node:fs";
import { configDotenv } from "dotenv";

configDotenv();

let server = new httpServer(3000);

server.addRoute("/", (req, res) => {
    res.end(`API has been started succesfully. Page generated on [${new Date().toISOString()}]`);
});

server.addRoute("/ical", async (req, res) => {
    await fetchDates();

    generateIcal().then((ical) => {
        res.end(ical.toString());
    });
});

server.addRoute(/\/json/, async (req, res) => {
    await fetchDates();

    fetchSchedule().then((result: CombinedEvent[]) => {
        if (server.currentUrl?.searchParams.get("pretty") !== null) {
            res.end(JSON.stringify(result, null, 4));
        } else {
            res.end(JSON.stringify(result));
        }
    });
});
