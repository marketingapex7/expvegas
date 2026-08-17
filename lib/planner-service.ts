import { seedEvents } from "@/data/seed-events";
import { buildItinerary } from "@/lib/itinerary-engine";
import { diversifyEventsByTicketBudget } from "@/lib/budget-preferences";
import { isHeadlineEvent, rankEvents } from "@/lib/scoring";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";
import { canonicalEventKey, collapseEventShowtimes } from "@/lib/event-identity";
import { readPreferences } from "@/lib/planner-preferences";
import { EventCategory, VegasEvent } from "@/types/event";
import { ItineraryDay, PlannerInput, PlannerResponse, TripSummary } from "@/types/planner";

export function parseTravelDates(travelDates?: string) {
  if (!travelDates) return {};
  const dates = travelDates.match(/\d{4}-\d{2}-\d{2}/g) || [];
  return { startDate: dates[0], endDate: dates[1] || dates[0] };
}

export function plannerInventoryEndDate(startDate?: string, endDate?: string) {
  if (!startDate || !endDate || endDate <= startDate) return endDate;

  const lastItineraryDay = new Date(`${endDate}T00:00:00Z`);
  lastItineraryDay.setUTCDate(lastItineraryDay.getUTCDate() - 1);
  return lastItineraryDay.toISOString().slice(0, 10);
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
  const goCityBlocks = blocks.filter((block) => block.provider === "go-city");
  const bookable = blocks.filter((block) => block.bookingUrl && block.provider !== "go-city");
  const flexible = blocks.filter((block) => !block.bookingUrl && ["free", "shopping", "casino"].includes(block.category));
  const lodgingBlock = blocks.find((block) => block.title === "Lodging target before you book");
  const { lodgingIsFlexible } = readPreferences(input);
  const lodging = lodgingIsFlexible ? "Not booked yet" : input.stayingNear || "Not specified";
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
  const bookNow = [
    ...(goCityBlocks.length > 0 ? [`Compare one Go City pass for ${goCityBlocks.length} included ${goCityBlocks.length === 1 ? "attraction" : "attractions"}`] : []),
    ...bookable.map((block) => block.title),
  ].slice(0, 5);
  const keepFlexible = flexible.slice(0, 5).map((block) => block.title);
  const eventVenue = scheduledAnchor?.venueName ? ` around ${scheduledAnchor.venueName}` : "";
  const logistics = lodgingIsFlexible
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

export async function generatePlannerResponse(input: PlannerInput): Promise<PlannerResponse> {
  const { startDate, endDate } = parseTravelDates(input.travelDates);
  const category = inferCategory(input);
  let liveEvents: VegasEvent[] = [];

  try {
    liveEvents = await searchTicketmasterEvents({
      startDate,
      endDate: plannerInventoryEndDate(startDate, endDate),
      category,
    });
  } catch {
    liveEvents = [];
  }

  // Editorial picks remain useful comparison options, but they are deliberately
  // undated. Only provider inventory with a confirmed date and time can become a
  // timed itinerary anchor.
  const ranked = rankEvents(collapseEventShowtimes([...liveEvents, ...seedEvents]), input);
  const headlineEvents = ranked.filter(isHeadlineEvent);
  const budgetDiversifiedEvents = diversifyEventsByTicketBudget(headlineEvents, input.budget);
  const fallbackBest = headlineEvents[0];

  if (!fallbackBest) throw new Error("No Vegas events are available to build a plan right now.");

  // Offered by name only on days with no confirmed anchor. These have no
  // verified showtime, so they inform the open evening rather than fill it.
  const eveningSuggestions = headlineEvents.filter(
    (event) => !event.id.startsWith("ticketmaster-") && ["shows", "comedy"].includes(event.category),
  );

  const itineraryDays = buildItinerary({
    plannerInput: input,
    startDate,
    endDate,
    rankedEvents: headlineEvents,
    eveningSuggestions,
  });
  const firstScheduledEvent = itineraryDays.flatMap((day) => day.blocks).find((block) => block.category === "event");
  const scheduledAnchor = firstScheduledEvent
    ? ranked.find((event) => event.name === firstScheduledEvent.title)
    : undefined;
  const hasLiveScheduledAnchor = Boolean(scheduledAnchor?.id.startsWith("ticketmaster-"));
  const best = scheduledAnchor || fallbackBest;
  const bestKey = canonicalEventKey(best);
  const backups = budgetDiversifiedEvents.filter((event) => canonicalEventKey(event) !== bestKey).slice(0, 3);
  const liveHeadlineCount = liveEvents.filter(isHeadlineEvent).length;
  const anchorDay = itineraryDays.find((day) => day.blocks.some((block) => block.category === "event")) || itineraryDays[0];

  return {
    headline: hasLiveScheduledAnchor ? "Your Vegas Plan From Live Events" : "Your Vegas Plan",
    bestPickId: best.id,
    bestPickName: best.name,
    bestPickScheduled: Boolean(scheduledAnchor),
    whyItFits: buildWhyItFits(best, input, liveHeadlineCount),
    timeline: anchorDay.blocks.map((block) => ({ time: block.time, title: block.title, description: block.description })),
    backupPickIds: backups.map((event) => event.id),
    backupPickNames: backups.map((event) => event.name),
    partySize: input.partySize || 1,
    cheaperVersion: headlineEvents.find((event) => event.priceMin && event.priceMin < 60)?.name,
    premiumVersion: headlineEvents.find((event) => event.priceMin && event.priceMin >= 100)?.name,
    avoid: input.dealbreakers ? [`Avoid anything matching: ${input.dealbreakers}`] : [],
    sourceSummary:
      hasLiveScheduledAnchor
        ? `Live schedule checked for your dates. Included ${liveHeadlineCount} headline Ticketmaster event${liveHeadlineCount === 1 ? "" : "s"} to compare after removing add-ons and retail listings.`
        : liveHeadlineCount > 0
          ? "Live inventory was checked, but no suitable timed anchor was confirmed. The plan keeps the evening flexible and shows curated picks only for comparison."
          : "No live Ticketmaster anchor was available, so the timed plan stays flexible and curated picks remain unscheduled.",
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
