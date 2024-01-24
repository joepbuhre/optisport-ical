import sqlite3 from "sqlite3";
import fs from "node:fs";
import { logger } from "./logger";

// Open SQLite database
const initializeDatabase = async () => {
    const db = new sqlite3.Database("schedule.db");

    // Create CombinedEvent table if not exists with a unique constraint
    db.exec(`
      CREATE TABLE IF NOT EXISTS CombinedEvent (
        date TEXT,
        day TEXT,
        title TEXT,
        internalLocation TEXT,
        start TEXT,
        end TEXT,
        source TEXT,
        themeColor TEXT,
        url TEXT,
        UNIQUE(date, day, title, start, end)
      );

      CREATE TABLE IF NOT EXISTS LastQuery (
        date bigint
      )
    `);

    return db;
};

export const fetchSchedule = async () => {
    const db = await initializeDatabase();

    return new Promise(
        (resolve: (value: CombinedEvent[]) => void, reject: (error: any) => void) => {
            db.all("select * from CombinedEvent", (error, result) => {
                db.close();
                if (error) reject(error);

                let filterFunc: undefined | ((val: any) => void) = undefined;

                try {
                    filterFunc = new Function(
                        fs.readFileSync(process.env.FILTER_PATH).toString()
                    )();
                } catch (error) {
                    logger.info(error);
                }
                if (filterFunc) {
                    logger.info("Filter function found");
                    logger.info(filterFunc.toString());
                    result = result.filter(filterFunc);
                }
                resolve(<CombinedEvent[]>result);
            });
        }
    );
};

export const shouldRequest = async (): Promise<boolean> => {
    const db = await initializeDatabase();

    let res: boolean =
        (await new Promise((resolve: (value?: boolean) => void, reject: (error?: any) => void) => {
            db.get("select max(date) as dt from LastQuery", (error, result: { dt: number }) => {
                if (error) {
                    reject(error);
                }
                let compareDate = new Date();
                compareDate.setMinutes(compareDate.getMinutes() - 30);
                // If fetchdate is in the last 30 minutes, let's return false
                resolve(!(result.dt > compareDate.getTime()));
            });
        }).catch((err) => true)) ?? false;

    db.close();
    return res;
};

export const setFetchDate = async (db: sqlite3.Database) => {
    db.run(
        `
    INSERT INTO LastQuery (date)
    VALUES (?);
    `,
        [new Date().getTime()]
    );
};
// Insert or update CombinedEvents
export const insertOrUpdateCombinedEvents = async (schedules: Schedule[] | Schedule) => {
    const db = await initializeDatabase();

    if (!Array.isArray(schedules)) {
        schedules = [schedules];
    }

    // Begin a transaction

    try {
        // Insert or update each CombinedEvent
        for (const schedule of schedules) {
            for (const event of schedule.events) {
                const { date, day } = schedule;
                const { title, internalLocation, start, end, source, themeColor, url } = event;

                db.run(
                    `
          INSERT OR IGNORE INTO CombinedEvent (date, day, title, internalLocation, start, end, source, themeColor, url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
                    [date, day, title, internalLocation, start, end, source, themeColor, url]
                );

                // For updates, use REPLACE (it will delete the existing row and insert a new one)
                db.run(
                    `
          REPLACE INTO CombinedEvent (date, day, title, internalLocation, start, end, source, themeColor, url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
                    [date, day, title, internalLocation, start, end, source, themeColor, url]
                );
            }

            // Commit the transaction
            await setFetchDate(db);
        }
    } catch (error) {
        // Rollback the transaction in case of an error
        throw error;
    } finally {
        // Close the database connection
        db.close();
    }
};
