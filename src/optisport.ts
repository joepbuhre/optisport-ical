import puppeteer from "puppeteer-extra";
import { HTTPRequest, HTTPResponse, Page } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { fetchSchedule, insertOrUpdateCombinedEvents, shouldRequest } from "./db";
import { logger } from "./logger";
const repeatRequest = async (page: Page, request: HTTPRequest, pageNr: number) => {
    let postdata: OptisportPostBody = JSON.parse(request.postData() ?? "{}");
    postdata.page = pageNr;
    return await page.evaluate(
        async (
            url: string,
            headers: ReturnType<typeof request.headers>,
            method: string,
            postdata: string
        ) => {
            const response = await fetch(url, {
                headers: headers,
                body: postdata,
                method: method,
            });
            const data = await response.json();
            return data;
        },
        request.url(),
        request.headers(),
        request.method(),
        JSON.stringify(postdata)
    );
};

export const fetchDates = async () => {
    let sRequest = await shouldRequest();

    puppeteer.use(StealthPlugin());

    if (sRequest === false) {
        logger.info("Last data is within timeframe, skipping fetching appointments");
        return;
    }

    const browser = await puppeteer.launch({
        headless: process.env.HEADLESS_MODE,
        args: ["--no-sandbox"],
    });
    logger.debug("Browser launched");
    const page = await browser.newPage();
    page.on("error", (err) => logger.warn("Page error: ", err));
    page.on("pageerror", (pageerr) => logger.warn("Page error: ", pageerr));
    page.on("requestfailed", (request) => logger.warn("Request failed: %s", request.url()));

    page.on("response", (response: HTTPResponse) => {
        let search = new RegExp("upcomingeventsschedule");
        let res = search.exec(response.url());
        // Check if request is the upcoming eventsschedule
        if (res !== null && sRequest) {
            response.json().then((jsonRes: OptisportResponse) => {
                let request = response.request();
                let postdata: OptisportPostBody = JSON.parse(request.postData() ?? "{}");
                logger.info("Currently on page %i", postdata.page);

                if (postdata.page < jsonRes.last_page) {
                    repeatRequest(page, request, postdata.page + 1);
                }

                insertOrUpdateCombinedEvents(jsonRes.schedule);
                logger.debug(jsonRes, "Found object");

                if (postdata.page === jsonRes.last_page) {
                    logger.info("All available pages processed");
                    browser.close();
                }
            });
        }
        return response;
    });

    await page.goto("https://www.optisport.nl/activiteiten/banenzwemmen/zwembad-sonsbeeck-breda");
};
