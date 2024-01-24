import ical, { ICalCalendarMethod } from "ical-generator";
import fs from "node:fs";
import { fetchSchedule } from "./db";

export const generateIcal = async () => {
    const calendar = ical({ name: process.env.CALENDER_NAME ?? "Optisport Ical" });

    let schedule = await fetchSchedule().catch((err) => []);

    // A method is required for outlook to display event as an invitation
    calendar.method(ICalCalendarMethod.REQUEST);

    for (let i = 0; i < schedule.length; i++) {
        const event = schedule[i];
        calendar.createEvent({
            start: new Date(event.start),
            end: new Date(event.end),
            summary: event.title,
            location: event.internalLocation,
        });
    }
    return calendar;
};
