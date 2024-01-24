import puppeteer from "puppeteer-extra";
import { HTTPRequest, HTTPResponse, Page } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { fetchSchedule, insertOrUpdateCombinedEvents, shouldRequest } from "./db";
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
        // console.log("nope here");
        return;
    }

    const browser = await puppeteer.launch({
        headless: "new", //process.env?.["NODE_ENV"] === "production",
        args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    page.on("error", (err) => console.error("Page error: ", err));
    page.on("pageerror", (pageerr) => console.error("Page error: ", pageerr));
    page.on("requestfailed", (request) => console.error("Request failed: ", request.url()));

    page.on("response", (response: HTTPResponse) => {
        let search = new RegExp("upcomingeventsschedule");
        let res = search.exec(response.url());
        if (res !== null && sRequest) {
            response.json().then((jsonRes: OptisportResponse) => {
                let request = response.request();
                let postdata: OptisportPostBody = JSON.parse(request.postData() ?? "{}");

                if (postdata.page < jsonRes.last_page) {
                    repeatRequest(page, request, postdata.page + 1);
                }

                insertOrUpdateCombinedEvents(jsonRes.schedule);
                console.log(jsonRes);

                if (postdata.page === jsonRes.last_page) {
                    console.log("we are doneeeee");
                    browser.close();
                }
            });
        }
        return response;
    });

    await page.goto("https://www.optisport.nl/activiteiten/banenzwemmen/zwembad-sonsbeeck-breda");
};
