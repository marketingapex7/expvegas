import { NextResponse } from "next/server";
import { seedEvents } from "@/data/seed-events";
import { buildItinerary } from "@/lib/itinerary-engine";
import { rankEvents } from "@/lib/scoring";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";
import { EventCategory, VegasEvent } from "@/types/event";
import { ItineraryDay, PlannerInput, PlannerResponse, TripSummary } from "@/types/planner";

function parseTravelDates(travelDates?: string) {
  if (!travelDates) return {};

  const dates = travelDates.match(/\d{4}-\d{2}-\d{2}/g) || [];
  return {
    startDate: dates[0],
    endDate: dates[1] || dates[0],
  };
}

function inferCategory(input: PlannerInput): EventCategory | undefined {
  const text = `${input.prompt || ""} ${input.vibe || ""}`.toLowerCase();

  if (text.includes("sport") || text.includes("game") || text.includes("arena")) return "sports";
  if (text.includes("concert") || text.includes("music") || text.includes("residency")) return "concerts";
  if (text.includes("comedy") || text.includes("laugh")) return "comedy";
  if (text.includes("show") || text.includes("cirque") || text.includes("magic")) return "shows";
  if (text.includes("attraction") || text.includes("view") || text.includes("sphere")) return "attractions";

  return undefined;
}

function formatTimelineTime(event: VegasEvent) {
  if (!event.localDate || !event.localTime) return "Main event";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`${event.localDate}T${event.localTime}`));
}

function buildWhyItFits(best: VegasEvent, input: PlannerInput, liveEventCount: number) {
  const group = input.groupType || "your group";
  const budget = input.budget || "your budget";
  const vibe = input.vibe || input.prompt || "the night you described";
  const sourceNote =
    best.id.startsWith("ticketmaster-") && liveEventCount > 0
      ? "It is pulled from current Ticketmaster schedule data for your selected dates."
      : "It is one of our curated fallback picks while live inventory is limited.";

  return `${best.name} is the strongest match for ${group} with ${budget} and a ${vibe} vibe. ${sourceNote}`;
}

function lodgingIsFlexible(input: PlannerInput) {
  const text = `${input.stayingNear || ""} ${input.prompt || ""} ${input.additionalDetails || ""}`.toLowerCase();
  return !input.stayingNear || text.includes("not booked") || text.includes("haven't booked") || text.includes("havent booked");
}

function estimateSpend(itineraryDays: ItineraryDay[]) {
  let low = 0;
  let high = 0;

  for (const block of itineraryDays.flatMap((day) => day.blocks)) {
    if (block.category === "event" && block.priceHint) {
      const prices = block.priceHint.match(/\d+/g)?.map(Number) || [];
      low += prices[0] || 75;
      high += prices[1] || prices[0] || 150;
    }

    if (block.category === "meal") {
      low += 35;
      high += 90;
    }
  }

  return low > 0 ? `$${low}-${high} per person before hotel` : "Mostly flexible spend before hotel";
}

function buildTripSummary(input: PlannerInput, itineraryDays: ItineraryDay[], best: VegasEvent): TripSummary {
  const blocks = itineraryDays.flatMap((day) => day.blocks);
  const bookable = blocks.filter((block) => block.bookingUrl);
  const flexible = blocks.filter((block) => !block.bookingUrl && ["free", "shopping", "casino"].includes(block.category));
  const lodgingBlock = blocks.find((block) => block.title === "Lodging target before you book");
  const lodging = lodgingIsFlexible(input) ? "Not booked yet" : input.stayingNear || "Not specified";
  const bestLodgingZone = lodgingBlock?.description;
  const tripStyle = [
    input.groupType,
    input.budget,
    input.vibe,
    input.foodPreference,
    input.gamblingPreference,
    input.pace,
  ].filter(Boolean).slice(0, 5) as string[];
  const bookNow = bookable.slice(0, 5).map((block) => block.title);
  const keepFlexible = flexible.slice(0, 5).map((block) => block.title);
  const eventVenue = best.venueName ? ` around ${best.venueName}` : "";
  const logistics = lodgingIsFlexible(input)
    ? "It starts with a lodging zone recommendation before locking in the timed plan."
    : `It keeps the plan oriented around ${input.stayingNear}.`;

  return {
    lodging,
    bestLodgingZone,
    tripStyle: tripStyle.length > 0 ? tripStyle : ["Flexible Vegas trip"],
    estimatedSpend: estimateSpend(itineraryDays),
    bookNow: bookNow.length > 0 ? bookNow : ["Choose the main event once dates are firm"],
    keepFlexible: keepFlexible.length > 0 ? keepFlexible : ["Leave one open block for group energy"],
    whyThisPlanWorks: `${logistics} The plan uses ${best.name}${eventVenue} as the main anchor, then surrounds it with meals and flexible Vegas stops so the day does not become a ticket checklist.`,
  };
}

export async function POST(request: Request) {
  const input = (await request.json()) as PlannerInput;
  const { startDate, endDate } = parseTravelDates(input.travelDates);
  const category = inferCategory(input);
  let liveEvents: VegasEvent[] = [];

  try {
    liveEvents = await searchTicketmasterEvents({
      startDate,
      endDate,
      category,
      size: 40,
    });
  } catch {
    liveEvents = [];
  }

  const ranked = rankEvents([...liveEvents, ...seedEvents], input);
  const best = ranked[0];
  const backups = ranked.slice(1, 4);
  const itineraryDays = buildItinerary({ plannerInput: input, startDate, endDate, rankedEvents: ranked });
  const tripSummary = buildTripSummary(input, itineraryDays, best);

  const output: PlannerResponse = {
    headline: liveEvents.length > 0 ? "Your Vegas Game Plan From Live Events" : "Your Vegas Game Plan",
    bestPickId: best.id,
    bestPickName: best.name,
    whyItFits: buildWhyItFits(best, input, liveEvents.length),
    timeline: [
      { time: "6:00 PM", title: `Dinner or drinks near ${best.venueName}` },
      { time: formatTimelineTime(best), title: best.name, description: best.quickVerdict },
      { time: "9:45 PM", title: "Walkable drinks or late-night add-on" },
    ],
    backupPickIds: backups.map((event) => event.id),
    backupPickNames: backups.map((event) => event.name),
    cheaperVersion: ranked.find((event) => event.priceMin && event.priceMin < 60)?.name,
    premiumVersion: ranked.find((event) => event.priceMin && event.priceMin >= 100)?.name,
    avoid: input.dealbreakers ? [`Avoid anything matching: ${input.dealbreakers}`] : [],
    sourceSummary:
      liveEvents.length > 0
        ? `Included ${liveEvents.length} live Ticketmaster event${liveEvents.length === 1 ? "" : "s"} for the selected dates.`
        : "No live Ticketmaster events were available, so this used curated ExperienceVegas picks.",
    itineraryDays,
    tripSummary,
  };

  return NextResponse.json(output);
}
