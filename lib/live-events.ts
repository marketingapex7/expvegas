import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";
import { VegasEvent } from "@/types/event";

const VEGAS_TIME_ZONE = "America/Los_Angeles";

function dateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VEGAS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days, 12));
  return value.toISOString().slice(0, 10);
}

function dayOfWeek(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function getVegasToday() {
  return dateParts(new Date());
}

function getVegasMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VEGAS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  return value("hour") * 60 + value("minute");
}

function timeToMinutes(value?: string) {
  if (!value) return -1;
  const [hour, minute] = value.split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : -1;
}

export function getVegasWeekend(today = getVegasToday()) {
  const weekday = dayOfWeek(today);
  const daysUntilFriday = weekday >= 5 ? 0 : 5 - weekday;
  const startDate = addDays(today, daysUntilFriday);
  return { startDate, endDate: addDays(startDate, 2) };
}

type LiveEventResult = {
  events: VegasEvent[];
  isLive: boolean;
  startDate: string;
  endDate: string;
};

export type HomepageEventShelf = LiveEventResult & {
  tier: "tonight" | "tomorrow" | "weekend" | "resident";
  eyebrow: string;
  title: string;
  description: string;
  updatedLabel: string;
};

let lastGoodHomepageShelf: HomepageEventShelf | null = null;

function collapseShowtimes(events: VegasEvent[]) {
  const grouped = new Map<string, VegasEvent>();

  for (const event of events) {
    const key = `${event.name.trim().toLowerCase()}|${event.venueName.trim().toLowerCase()}`;
    const showtime = {
      id: event.id,
      localDate: event.localDate,
      localTime: event.localTime,
      startDateTime: event.startDateTime,
      affiliateUrl: event.affiliateUrl,
    };
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, { ...event, showtimes: [showtime] });
      continue;
    }

    existing.showtimes = [...(existing.showtimes || []), showtime]
      .filter((item, index, values) => values.findIndex((value) => value.id === item.id) === index)
      .sort((a, b) => `${a.localDate || ""}T${a.localTime || ""}`.localeCompare(`${b.localDate || ""}T${b.localTime || ""}`));
  }

  return [...grouped.values()];
}

export async function getLiveVegasEvents(startDate: string, endDate = startDate, size = 20): Promise<LiveEventResult> {
  if (!process.env.TICKETMASTER_API_KEY) {
    return { events: rankEvents(seedEvents), isLive: false, startDate, endDate };
  }

  try {
    const events = await searchTicketmasterEvents({ startDate, endDate, size });
    if (events.length) return { events: rankEvents(collapseShowtimes(events)), isLive: true, startDate, endDate };
  } catch (error) {
    console.error("Live Ticketmaster inventory unavailable", error);
  }

  return {
    events: rankEvents(seedEvents),
    isLive: false,
    startDate,
    endDate,
  };
}

export function filterTonightEvents(events: VegasEvent[], date: string, earliestStart: number) {
  return events.flatMap((event) => {
    const showtimes = (event.showtimes || [{
      id: event.id,
      localDate: event.localDate,
      localTime: event.localTime,
      startDateTime: event.startDateTime,
      affiliateUrl: event.affiliateUrl,
    }])
      .filter((showtime) => showtime.localDate === date && timeToMinutes(showtime.localTime) >= earliestStart)
      .sort((a, b) => timeToMinutes(a.localTime) - timeToMinutes(b.localTime));

    const first = showtimes[0];
    return first
      ? [{
          ...event,
          localDate: first.localDate,
          localTime: first.localTime,
          startDateTime: first.startDateTime,
          affiliateUrl: first.affiliateUrl,
          showtimes,
        }]
      : [];
  });
}

export async function getTonightVegasEvents(date = getVegasToday(), size = 20): Promise<LiveEventResult> {
  const result = await getLiveVegasEvents(date, date, size);
  if (!result.isLive) return result;

  const earliestStart = date === getVegasToday() ? Math.max(16 * 60, getVegasMinutesNow()) : 16 * 60;
  const events = filterTonightEvents(result.events, date, earliestStart);

  return { ...result, events };
}

function vegasTimeLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: VEGAS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function shelf(
  result: LiveEventResult,
  events: VegasEvent[],
  tier: HomepageEventShelf["tier"],
  eyebrow: string,
  title: string,
  description: string,
): HomepageEventShelf {
  return {
    ...result,
    events: events.slice(0, 6),
    tier,
    eyebrow,
    title,
    description,
    updatedLabel: `Updated ${vegasTimeLabel()}`,
  };
}

export async function getHomepageEventShelf(): Promise<HomepageEventShelf> {
  const today = getVegasToday();
  const tomorrow = addDays(today, 1);
  const earliestTonight = Math.max(16 * 60, getVegasMinutesNow() + 120);
  const tonightResult = await getLiveVegasEvents(today, today, 40);

  if (tonightResult.isLive) {
    const tonightEvents = filterTonightEvents(tonightResult.events, today, earliestTonight);
    if (tonightEvents.length >= 3) {
      lastGoodHomepageShelf = shelf(
        tonightResult,
        tonightEvents,
        "tonight",
        "Live tonight",
        "Events that still fit tonight.",
        "Future start times only, with enough room to get there without rushing.",
      );
      return lastGoodHomepageShelf;
    }
  }

  const tomorrowResult = await getLiveVegasEvents(tomorrow, tomorrow, 40);
  if (tomorrowResult.isLive && tomorrowResult.events.length >= 3) {
    lastGoodHomepageShelf = shelf(
      tomorrowResult,
      tomorrowResult.events,
      "tomorrow",
      "Coming up",
      "Worth considering tomorrow.",
      "A useful next-day shortlist when tonight's remaining schedule is too thin.",
    );
    return lastGoodHomepageShelf;
  }

  const weekend = getVegasWeekend(today);
  const weekendResult = await getLiveVegasEvents(weekend.startDate, weekend.endDate, 50);
  if (weekendResult.isLive && weekendResult.events.length >= 3) {
    lastGoodHomepageShelf = shelf(
      weekendResult,
      weekendResult.events,
      "weekend",
      "This weekend",
      "Strong events across the weekend.",
      "Date-specific options from the live schedule, capped to the most useful six.",
    );
    return lastGoodHomepageShelf;
  }

  if (lastGoodHomepageShelf) {
    return {
      ...lastGoodHomepageShelf,
      description: "The last confirmed schedule is shown while the live feed reconnects.",
    };
  }

  const residentEvents = seedEvents.filter((event) => event.category !== "sports");

  return shelf(
    { events: residentEvents, isLive: false, startDate: today, endDate: weekend.endDate },
    residentEvents,
    "resident",
    "Always on in Vegas",
    "Reliable Vegas anchors to plan around.",
    "Curated resident shows and attractions that remain useful when live inventory is thin.",
  );
}
