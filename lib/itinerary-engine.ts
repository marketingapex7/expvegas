import { attractionStops, casinoStops, PlanningStop, restaurantStops } from "@/data/planning-stops";
import { VegasEvent } from "@/types/event";
import { ItineraryBlock, ItineraryDay, PlannerInput } from "@/types/planner";

type BuildItineraryInput = {
  plannerInput: PlannerInput;
  startDate?: string;
  endDate?: string;
  rankedEvents: VegasEvent[];
};

function dateRange(startDate?: string, endDate?: string) {
  if (!startDate) return [];

  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate || startDate}T00:00:00`);

  for (const cursor = new Date(start); cursor <= end && dates.length < 7; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }

  return dates;
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function textFor(input: PlannerInput) {
  return `${input.prompt || ""} ${input.groupType || ""} ${input.budget || ""} ${input.vibe || ""} ${
    input.stayingNear || ""
  } ${input.foodPreference || ""} ${input.mealBudget || ""} ${input.gamblingPreference || ""} ${
    input.pace || ""
  } ${input.logistics || ""} ${input.additionalDetails || ""
  }`.toLowerCase();
}

function budgetPreference(input: PlannerInput): PlanningStop["budget"] | undefined {
  const text = `${input.prompt || ""} ${input.budget || ""} ${input.mealBudget || ""}`.toLowerCase();
  if (text.includes("under") || text.includes("cheap") || text.includes("value") || text.includes("$50")) return "value";
  if (text.includes("premium") || text.includes("splurge") || text.includes("worth it")) return "premium";
  return "mid";
}

function scoreStop(stop: PlanningStop, input: PlannerInput) {
  const text = textFor(input);
  const preferredBudget = budgetPreference(input);
  let score = stop.budget === preferredBudget ? 8 : 0;

  for (const tag of stop.tags) {
    if (text.includes(tag)) score += 5;
  }

  if (input.stayingNear && stop.area.toLowerCase().includes(input.stayingNear.toLowerCase().replace("near ", ""))) {
    score += 8;
  }

  return score;
}

function pickStop(stops: PlanningStop[], input: PlannerInput, offset: number) {
  const ranked = [...stops].sort((a, b) => scoreStop(b, input) - scoreStop(a, input));
  return ranked[offset % ranked.length];
}

function eventTime(event: VegasEvent, fallback: string) {
  if (!event.localDate || !event.localTime) return fallback;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`${event.localDate}T${event.localTime}`));
}

function eventsForDay(events: VegasEvent[], date: string) {
  const dated = events.filter((event) => event.localDate === date);
  return dated.length > 0 ? dated : events.filter((event) => !event.localDate).slice(0, 1);
}

function priceHint(event: VegasEvent) {
  if (!event.priceMin) return undefined;
  return event.priceMax ? `$${event.priceMin}-${event.priceMax}` : `From $${event.priceMin}`;
}

function buildBlocks(date: string, dayIndex: number, input: PlannerInput, events: VegasEvent[]): ItineraryBlock[] {
  const lunch = pickStop(restaurantStops, input, dayIndex);
  const attraction = pickStop(attractionStops, input, dayIndex);
  const dinner = pickStop(restaurantStops, input, dayIndex + 2);
  const casino = pickStop(casinoStops, input, dayIndex);
  const dayEvents = eventsForDay(events, date);
  const mainEvent = dayEvents[0];
  const text = textFor(input);
  const slowMorning = text.includes("slow morning");
  const packed = text.includes("packed");
  const noGambling = text.includes("no gambling");

  const blocks: ItineraryBlock[] = [
    {
      time: slowMorning ? "12:00 PM" : "11:00 AM",
      title: lunch.name,
      category: "meal",
      location: lunch.area,
      description: lunch.description,
    },
    {
      time: slowMorning ? "2:00 PM" : "1:00 PM",
      title: attraction.name,
      category: "attraction",
      location: attraction.area,
      description: attraction.description,
    },
    noGambling
      ? {
          time: "4:00 PM",
          title: "Hotel reset, lounge, or extra Strip walk",
          category: "free",
          location: attraction.area,
          description: "Keeps the plan Vegas-feeling without forcing casino time.",
        }
      : {
          time: "4:00 PM",
          title: casino.name,
          category: "casino",
          location: casino.area,
          description: casino.description,
        },
    {
      time: "6:00 PM",
      title: dinner.name,
      category: "meal",
      location: dinner.area,
      description: dinner.description,
    },
  ];

  if (mainEvent) {
    blocks.push({
      time: eventTime(mainEvent, "8:00 PM"),
      title: mainEvent.name,
      category: "event",
      location: mainEvent.venueName,
      description: mainEvent.quickVerdict,
      bookingUrl: mainEvent.affiliateUrl,
      priceHint: priceHint(mainEvent),
    });
  } else {
    blocks.push({
      time: "8:00 PM",
      title: "Open evening for a last-minute show or lounge",
      category: "free",
      description: "Keep this block flexible until live inventory or group energy makes the best choice obvious.",
    });
  }

  blocks.push({
    time: "10:30 PM",
    title: noGambling ? "Dessert, views, or a walkable lounge nearby" : "Walkable drinks, casino time, or dessert nearby",
    category: noGambling ? "free" : "casino",
    location: mainEvent?.venueName || dinner.area,
    description: "Keep the final stop close to avoid long rides after the main event.",
  });

  if (packed) {
    blocks.splice(2, 0, {
      time: "3:00 PM",
      title: "Quick bonus stop nearby",
      category: "attraction",
      location: attraction.area,
      description: "A short extra stop added because you asked for a fuller schedule.",
    });
  }

  return blocks;
}

function dayTheme(dayIndex: number, event?: VegasEvent) {
  if (dayIndex === 0) return "Arrival, orientation, and one strong anchor";
  if (event?.category === "sports") return "Arena energy and easy post-game logistics";
  if (event?.category === "concerts") return "Dinner, headline energy, and late-night momentum";
  if (event?.category === "comedy") return "Flexible day, easy laughs, and low-friction nightlife";
  return "Balanced Vegas day with food, exploring, gambling, and a main event";
}

export function buildItinerary({ plannerInput, startDate, endDate, rankedEvents }: BuildItineraryInput): ItineraryDay[] {
  const dates = dateRange(startDate, endDate);
  const itineraryDates = dates.length > 0 ? dates : [new Date().toISOString().slice(0, 10)];

  return itineraryDates.map((date, index) => {
    const dayEvents = eventsForDay(rankedEvents, date);

    return {
      date,
      label: formatDayLabel(date),
      theme: dayTheme(index, dayEvents[0]),
      blocks: buildBlocks(date, index, plannerInput, rankedEvents),
    };
  });
}
