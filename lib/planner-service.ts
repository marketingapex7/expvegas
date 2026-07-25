import { seedEvents } from "@/data/seed-events";
import { buildItinerary, isGoodAnchorEvent } from "@/lib/itinerary-engine";
import { diversifyEventsByTicketBudget } from "@/lib/budget-preferences";
import { isHeadlineEvent, rankEvents } from "@/lib/scoring";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";
import { EventCategory, VegasEvent } from "@/types/event";
import { ItineraryDay, PlannerInput, PlannerResponse, TripSummary } from "@/types/planner";

export function parseTravelDates(travelDates?: string) {
  if (!travelDates) return {};
  const dates = travelDates.match(/\d{4}-\d{2}-\d{2}/g) || [];
  return { startDate: dates[0], endDate: dates[1] || dates[0] };
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

function buildWhyItFits(best: VegasEvent, input: PlannerInput, liveEventCount: number) {
  const group = input.groupType || "your group";
  const budget = input.budget || "your event ticket budget";
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

function estimateSpend(itineraryDays: ItineraryDay[], partySize = 1) {
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

  if (low <= 0) return "Mostly flexible spend before hotel";
  const groupLow = low * partySize;
  const groupHigh = high * partySize;
  return `$${low}-${high} per person; about $${groupLow.toLocaleString("en-US")}-$${groupHigh.toLocaleString("en-US")} for ${partySize} traveler${partySize === 1 ? "" : "s"}, before hotel`;
}

function buildTripSummary(input: PlannerInput, itineraryDays: ItineraryDay[], scheduledAnchor?: VegasEvent): TripSummary {
  const blocks = itineraryDays.flatMap((day) => day.blocks);
  const bookable = blocks.filter((block) => block.bookingUrl);
  const flexible = blocks.filter((block) => !block.bookingUrl && ["free", "shopping", "casino"].includes(block.category));
  const lodgingBlock = blocks.find((block) => block.title === "Lodging target before you book");
  const lodging = lodgingIsFlexible(input) ? "Not booked yet" : input.stayingNear || "Not specified";
  const tripStyle = [
    input.groupType,
    input.budget ? `Tickets: ${input.budget}` : undefined,
    input.mealBudget ? `Food: ${input.mealBudget}` : undefined,
    input.vibe,
    input.foodPreference,
    input.gamblingPreference,
    input.pace,
  ].filter(Boolean).slice(0, 5) as string[];
  const assumptions = [
    input.groupType ? `Built for ${input.groupType}` : undefined,
    input.budget ? `Ticket budget: ${input.budget}` : undefined,
    input.mealBudget ? `Food spend: ${input.mealBudget}` : undefined,
    input.stayingNear ? `Lodging: ${input.stayingNear}` : "Lodging zone still flexible",
    input.pace ? `Pace: ${input.pace}` : undefined,
  ].filter(Boolean).slice(0, 5) as string[];
  const bookNow = bookable.slice(0, 5).map((block) => block.title);
  const keepFlexible = flexible.slice(0, 5).map((block) => block.title);
  const eventVenue = scheduledAnchor?.venueName ? ` around ${scheduledAnchor.venueName}` : "";
  const logistics = lodgingIsFlexible(input)
    ? "It starts with a lodging zone recommendation before locking in the timed plan."
    : `It keeps the plan oriented around ${input.stayingNear}.`;
  const anchorNote = scheduledAnchor
    ? `The plan uses ${scheduledAnchor.name}${eventVenue} as the main anchor, then surrounds it with meals and flexible Vegas stops so the day does not become a ticket checklist.`
    : "The plan leaves the headline slot open and builds around meals and flexible Vegas stops, so you can drop in a show once you have picked one.";

  return {
    lodging,
    bestLodgingZone: lodgingBlock?.description,
    tripStyle: tripStyle.length > 0 ? tripStyle : ["Flexible Vegas trip"],
    assumptions: assumptions.length > 0 ? assumptions : ["Balanced schedule with one main anchor"],
    estimatedSpend: estimateSpend(itineraryDays, input.partySize || 1),
    bookNow: bookNow.length > 0 ? bookNow : ["Choose the main event once dates are firm"],
    keepFlexible: keepFlexible.length > 0 ? keepFlexible : ["Leave one open block for group energy"],
    whyThisPlanWorks: `${logistics} ${anchorNote}`,
  };
}

function dateRange(startDate?: string, endDate?: string) {
  if (!startDate) return [];
  const dates: string[] = [];
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate || startDate}T12:00:00Z`);
  for (const cursor = new Date(start); cursor <= end && dates.length < 7; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

function scheduledFallbackEvents(startDate: string | undefined, endDate: string | undefined, liveEvents: VegasEvent[], input: PlannerInput) {
  const anchors = seedEvents.filter((event) => ["shows", "comedy", "attractions"].includes(event.category));

  return dateRange(startDate, endDate).flatMap((date, index) => {
    const hasLiveAnchor = liveEvents.some(
      (event) => event.localDate === date && isGoodAnchorEvent(event, input, index === 0),
    );
    if (hasLiveAnchor) return [];

    const event = anchors[index % anchors.length];
    const localTime = event.name === "O by Cirque du Soleil" ? "21:00:00" : "20:00:00";
    return [{
      ...event,
      id: `curated-${date}-${event.id}`,
      localDate: date,
      localTime,
      quickVerdict: `${event.quickVerdict} This is a planning slot; confirm the current performance time before booking.`,
    }];
  });
}

export async function generatePlannerResponse(input: PlannerInput): Promise<PlannerResponse> {
  const { startDate, endDate } = parseTravelDates(input.travelDates);
  const category = inferCategory(input);
  let liveEvents: VegasEvent[] = [];

  try {
    liveEvents = await searchTicketmasterEvents({ startDate, endDate, category });
  } catch {
    liveEvents = [];
  }

  // Curated anchors are added per day rather than only when live inventory is
  // completely empty. A day with live events but no usable evening anchor would
  // otherwise fall through to an "open evening" placeholder.
  const fallbackSchedule = scheduledFallbackEvents(startDate, endDate, liveEvents, input);
  const ranked = rankEvents([...liveEvents, ...fallbackSchedule, ...seedEvents], input);
  const headlineEvents = ranked.filter(isHeadlineEvent);
  const budgetDiversifiedEvents = diversifyEventsByTicketBudget(headlineEvents, input.budget);
  const fallbackBest = headlineEvents[0];

  if (!fallbackBest) throw new Error("No Vegas events are available to build a plan right now.");

  const itineraryDays = buildItinerary({ plannerInput: input, startDate, endDate, rankedEvents: headlineEvents });
  const firstScheduledEvent = itineraryDays.flatMap((day) => day.blocks).find((block) => block.category === "event");
  const scheduledAnchor = firstScheduledEvent
    ? ranked.find((event) => event.name === firstScheduledEvent.title)
    : undefined;
  const best = scheduledAnchor || fallbackBest;
  const backups = budgetDiversifiedEvents.filter((event) => event.id !== best.id).slice(0, 3);
  const liveHeadlineCount = liveEvents.filter(isHeadlineEvent).length;
  const anchorDay = itineraryDays.find((day) => day.blocks.some((block) => block.category === "event")) || itineraryDays[0];

  return {
    headline: liveHeadlineCount > 0 ? "Your Vegas Plan From Live Events" : "Your Vegas Plan",
    bestPickId: best.id,
    bestPickName: best.name,
    whyItFits: buildWhyItFits(best, input, liveHeadlineCount),
    timeline: anchorDay.blocks.map((block) => ({ time: block.time, title: block.title, description: block.description })),
    backupPickIds: backups.map((event) => event.id),
    backupPickNames: backups.map((event) => event.name),
    cheaperVersion: headlineEvents.find((event) => event.priceMin && event.priceMin < 60)?.name,
    premiumVersion: headlineEvents.find((event) => event.priceMin && event.priceMin >= 100)?.name,
    avoid: input.dealbreakers ? [`Avoid anything matching: ${input.dealbreakers}`] : [],
    sourceSummary:
      liveHeadlineCount > 0
        ? `Live schedule checked for your dates. Included ${liveHeadlineCount} headline Ticketmaster event${liveHeadlineCount === 1 ? "" : "s"} to compare after removing add-ons and retail listings.`
        : "No live Ticketmaster events were available, so this used curated ExperienceVegas picks.",
    eventOptions: budgetDiversifiedEvents.slice(0, 20).map((event) => ({
      id: event.id,
      name: event.name,
      category: event.category,
      venueName: event.venueName,
      quickVerdict: event.quickVerdict,
      affiliateUrl: event.affiliateUrl,
      priceMin: event.priceMin,
      priceMax: event.priceMax,
      runtimeMinutes: event.runtimeMinutes,
      localDate: event.localDate,
      localTime: event.localTime,
    })),
    itineraryDays,
    tripSummary: buildTripSummary(input, itineraryDays, scheduledAnchor),
  };
}
