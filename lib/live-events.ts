import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";
import { collapseEventShowtimes } from "@/lib/event-identity";
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

// The last shelf built from confirmed live inventory, kept so a transient
// Ticketmaster outage falls back to real events rather than generic copy. It is
// stamped with the Vegas date it was built for: without that stamp the cache
// had no expiry, so a stale shelf could be re-served days later still labelled
// "Live tonight" and carrying its original "Updated ..." timestamp.
let lastGoodHomepageShelf: { shelf: HomepageEventShelf; builtForDate: string } | null = null;

function applyDisplayLimit(events: VegasEvent[], displayLimit?: number) {
  return displayLimit && displayLimit > 0 ? events.slice(0, displayLimit) : events;
}

/**
 * `displayLimit` caps what is rendered. It is deliberately applied after the
 * fetch and ranking, never pushed down into the Ticketmaster query: capping the
 * query sorted by date ascending would only ever return the earliest events of
 * the window and hide evening inventory entirely.
 */
export async function getLiveVegasEvents(startDate: string, endDate = startDate, displayLimit?: number): Promise<LiveEventResult> {
  if (!process.env.TICKETMASTER_API_KEY) {
    return { events: applyDisplayLimit(rankEvents(seedEvents), displayLimit), isLive: false, startDate, endDate };
  }

  try {
    const events = await searchTicketmasterEvents({ startDate, endDate });
    if (events.length) {
      return {
        events: applyDisplayLimit(rankEvents(collapseEventShowtimes(events)), displayLimit),
        isLive: true,
        startDate,
        endDate,
      };
    }
  } catch (error) {
    console.error("Live Ticketmaster inventory unavailable", error);
  }

  return {
    events: applyDisplayLimit(rankEvents(seedEvents), displayLimit),
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

export async function getTonightVegasEvents(date = getVegasToday(), displayLimit?: number): Promise<LiveEventResult> {
  // No display limit on the fetch: the evening filter below has to run against
  // the full day before anything is trimmed for display.
  const result = await getLiveVegasEvents(date, date);
  if (!result.isLive) return { ...result, events: applyDisplayLimit(result.events, displayLimit) };

  const earliestStart = date === getVegasToday() ? Math.max(16 * 60, getVegasMinutesNow()) : 16 * 60;
  const events = filterTonightEvents(result.events, date, earliestStart);

  return { ...result, events: applyDisplayLimit(events, displayLimit) };
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

/**
 * A cached shelf may only be re-served while its own window is still in the
 * future. A "tonight" or "tomorrow" shelf is scoped to the day it was built
 * for; a "weekend" shelf stays useful until the weekend it covers has passed.
 * Anything older is dropped so the homepage falls back to curated copy rather
 * than presenting yesterday's schedule as current.
 */
export function reusableShelf(
  cached: { shelf: HomepageEventShelf; builtForDate: string } | null,
  today: string,
  earliestTonight: number,
): HomepageEventShelf | null {
  if (!cached) return null;

  if (cached.shelf.tier === "weekend") {
    return today <= cached.shelf.endDate ? cached.shelf : null;
  }

  if (cached.builtForDate !== today) return null;

  // Same day, but start times keep passing. Re-apply the cutoff so a shelf
  // titled "Events that still fit tonight" only ever lists events that do.
  if (cached.shelf.tier === "tonight") {
    const stillAhead = filterTonightEvents(cached.shelf.events, today, earliestTonight);
    return stillAhead.length >= 3 ? { ...cached.shelf, events: stillAhead } : null;
  }

  return cached.shelf;
}

export async function getHomepageEventShelf(): Promise<HomepageEventShelf> {
  const today = getVegasToday();
  const tomorrow = addDays(today, 1);
  const earliestTonight = Math.max(16 * 60, getVegasMinutesNow() + 120);
  const remember = (built: HomepageEventShelf) => {
    lastGoodHomepageShelf = { shelf: built, builtForDate: today };
    return built;
  };
  const tonightResult = await getLiveVegasEvents(today, today);

  if (tonightResult.isLive) {
    const tonightEvents = filterTonightEvents(tonightResult.events, today, earliestTonight);
    if (tonightEvents.length >= 3) {
      return remember(shelf(
        tonightResult,
        tonightEvents,
        "tonight",
        "Live tonight",
        "Events that still fit tonight.",
        "Future start times only, with enough room to get there without rushing.",
      ));
    }
  }

  const tomorrowResult = await getLiveVegasEvents(tomorrow, tomorrow);
  if (tomorrowResult.isLive && tomorrowResult.events.length >= 3) {
    // Prefer evening inventory, which is what visitors are usually choosing
    // between, but keep the full day rather than show an empty shelf.
    const tomorrowEvening = filterTonightEvents(tomorrowResult.events, tomorrow, 16 * 60);
    return remember(shelf(
      tomorrowResult,
      tomorrowEvening.length >= 3 ? tomorrowEvening : tomorrowResult.events,
      "tomorrow",
      "Coming up",
      "Worth considering tomorrow.",
      "A useful next-day shortlist when tonight's remaining schedule is too thin.",
    ));
  }

  const weekend = getVegasWeekend(today);
  const weekendResult = await getLiveVegasEvents(weekend.startDate, weekend.endDate);
  if (weekendResult.isLive && weekendResult.events.length >= 3) {
    return remember(shelf(
      weekendResult,
      weekendResult.events,
      "weekend",
      "This weekend",
      "Strong events across the weekend.",
      "Date-specific options from the live schedule, capped to the most useful six.",
    ));
  }

  const reusable = reusableShelf(lastGoodHomepageShelf, today, earliestTonight);
  if (reusable) {
    return {
      ...reusable,
      description: "The last confirmed schedule is shown while the live feed reconnects.",
    };
  }

  lastGoodHomepageShelf = null;
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
