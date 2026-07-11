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

export async function getLiveVegasEvents(startDate: string, endDate = startDate, size = 20): Promise<LiveEventResult> {
  if (!process.env.TICKETMASTER_API_KEY) {
    return { events: rankEvents(seedEvents), isLive: false, startDate, endDate };
  }

  try {
    const events = await searchTicketmasterEvents({ startDate, endDate, size });
    if (events.length) return { events: rankEvents(events), isLive: true, startDate, endDate };
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
