interface OptisportResponse {
    schedule: Schedule[];
    last_page: number;
}

interface Schedule {
    date: string;
    day: string;
    events: Event[];
}

interface Event {
    title: string;
    internalLocation: string;
    start: string;
    end: string;
    source: string;
    themeColor: string;
    url: string;
}

interface OptisportPostBody {
    page: number;
    locationId: number;
    activityId: number;
    amount: string;
}

type CombinedEvent = Schedule & Event;
