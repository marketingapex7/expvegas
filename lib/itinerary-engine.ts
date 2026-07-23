import { attractionStops, casinoStops, freeExperienceStops, PlanningStop } from "@/data/planning-stops";
import { restaurants, VegasRestaurant } from "@/data/restaurants";
import { VegasEvent } from "@/types/event";
import { ItineraryBlock, ItineraryDay, PlannerInput } from "@/types/planner";
import { mealLevelsFromText } from "@/lib/budget-preferences";
import { estimateVegasTravel } from "@/lib/vegas-logistics";

type BuildItineraryInput = {
  plannerInput: PlannerInput;
  startDate?: string;
  endDate?: string;
  rankedEvents: VegasEvent[];
};

function dateRange(startDate?: string, endDate?: string) {
  if (!startDate) return [];

  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate || startDate}T00:00:00Z`);
  const exclusiveEnd = end > start ? end : new Date(start.getTime() + 24 * 60 * 60 * 1000);

  for (const cursor = new Date(start); cursor < exclusiveEnd && dates.length < 7; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
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

function lodgingIsFlexible(input: PlannerInput) {
  const lodging = `${input.stayingNear || ""} ${input.prompt || ""} ${input.additionalDetails || ""}`.toLowerCase();
  return lodging.includes("not booked") || lodging.includes("haven't booked") || lodging.includes("havent booked");
}

function normalizedStayArea(input: PlannerInput) {
  if (!input.stayingNear || lodgingIsFlexible(input)) return "";
  return input.stayingNear.toLowerCase().replace("near ", "").replace(" / ", " ");
}

function lodgingRecommendation(input: PlannerInput, event?: VegasEvent) {
  const text = textFor(input);

  if (event?.venueName.toLowerCase().includes("t-mobile") || text.includes("sports") || text.includes("arena")) {
    return "Target lodging around Park MGM, NYNY, Aria, or Cosmopolitan so arena nights stay easy.";
  }

  if (text.includes("sphere") || event?.venueName.toLowerCase().includes("sphere")) {
    return "Target lodging around Venetian, Palazzo, Wynn, or the north-center Strip for Sphere-friendly logistics.";
  }

  if (text.includes("downtown") || text.includes("fremont")) {
    return "Target Downtown/Fremont if you want cheaper rooms and late-night casino-hopping over Strip polish.";
  }

  if (text.includes("family")) {
    return "Target center Strip or south Strip so meals, attractions, and rideshares stay simple for the group.";
  }

  return "Target center Strip around Bellagio, Caesars, Cosmopolitan, or Paris for the easiest first-trip logistics.";
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
  const stayArea = normalizedStayArea(input);
  let score = stop.budget === preferredBudget ? 8 : 0;

  for (const tag of stop.tags) {
    if (text.includes(tag)) score += 5;
  }

  if (stayArea && stop.area.toLowerCase().includes(stayArea)) {
    score += 8;
  }

  return score;
}

function pickStop(stops: PlanningStop[], input: PlannerInput, offset: number) {
  const ranked = [...stops].sort((a, b) => scoreStop(b, input) - scoreStop(a, input));
  return ranked[offset % ranked.length];
}

function restaurantBudgetPreferences(input: PlannerInput): VegasRestaurant["priceLevel"][] {
  const selectedLevels = mealLevelsFromText(input.mealBudget);
  return selectedLevels.length > 0 ? selectedLevels : [budgetPreference(input) || "mid"];
}

function scoreRestaurant(restaurant: VegasRestaurant, input: PlannerInput) {
  const text = textFor(input);
  const preferredBudgets = restaurantBudgetPreferences(input);
  const stayArea = normalizedStayArea(input);
  const terms = [
    ...restaurant.cuisine,
    ...restaurant.categories,
    ...restaurant.bestFor,
    ...restaurant.vibeTags,
    ...(restaurant.dietaryTags || []),
    restaurant.area,
    restaurant.venue || "",
  ].map((term) => term.toLowerCase());

  let score = restaurant.editorialScore / 10;
  if (preferredBudgets.includes(restaurant.priceLevel)) score += 10;

  for (const term of terms) {
    if (term && text.includes(term)) score += 6;
  }

  if (stayArea && restaurant.area.toLowerCase().includes(stayArea)) {
    score += 10;
  }

  return score;
}

function pickRestaurant(input: PlannerInput, offset: number) {
  const ranked = [...restaurants].sort((a, b) => scoreRestaurant(b, input) - scoreRestaurant(a, input));
  return ranked[offset % ranked.length];
}

function eventTime(event: VegasEvent, fallback: string) {
  if (!event.localDate || !event.localTime) return fallback;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`${event.localDate}T${event.localTime}`));
}

function hourForEvent(event: VegasEvent) {
  if (!event.localTime) return undefined;
  return Number(event.localTime.split(":")[0]);
}

function eventMatchesIntent(event: VegasEvent, input: PlannerInput) {
  const text = textFor(input);
  const eventText = `${event.name} ${event.category} ${event.subcategory || ""} ${event.tags.join(" ")} ${event.quickVerdict}`.toLowerCase();

  if (eventText.includes("drag") || eventText.includes("brunch")) {
    return text.includes("drag") || text.includes("brunch") || text.includes("lgbtq") || text.includes("lgbt");
  }

  return true;
}

function isGoodAnchorEvent(event: VegasEvent, input: PlannerInput) {
  const hour = hourForEvent(event);
  const text = textFor(input);
  const wantsDaytime = text.includes("brunch") || text.includes("daytime") || text.includes("afternoon");

  if (!eventMatchesIntent(event, input)) return false;
  if (hour === undefined) return true;
  if (wantsDaytime) return hour >= 11;

  return hour >= 17;
}

function eventsForDay(events: VegasEvent[], date: string, input: PlannerInput) {
  const dated = events.filter((event) => event.localDate === date);
  const anchorable = dated.filter((event) => isGoodAnchorEvent(event, input));

  if (anchorable.length > 0) return anchorable;
  if (dated.length > 0) return [];

  return events.filter((event) => !event.localDate && eventMatchesIntent(event, input)).slice(0, 1);
}

function priceHint(event: VegasEvent) {
  if (!event.priceMin) return undefined;
  return event.priceMax ? `$${event.priceMin}-${event.priceMax}` : `From $${event.priceMin}`;
}

function timeLabelFromMinutes(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

function eventStartMinutes(event?: VegasEvent) {
  if (!event?.localTime) return undefined;
  const [hour, minute] = event.localTime.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

function defaultDuration(block: ItineraryBlock) {
  if (block.durationMinutes) return block.durationMinutes;
  if (block.category === "meal") return 90;
  if (block.category === "event") return 120;
  if (block.category === "attraction") return 90;
  if (block.category === "casino") return 75;
  if (block.category === "shopping") return 75;
  return 60;
}

function bufferBetween(block: ItineraryBlock, nextBlock?: ItineraryBlock) {
  const activityBuffer = block.category === "event" ? 30 : block.category === "meal" ? 20 : 15;
  if (!block.location || !nextBlock?.location) return activityBuffer;

  const travel = estimateVegasTravel(block.location, nextBlock.location);
  return Math.max(activityBuffer, travel.maxMinutes + 5);
}

export function sanitizeSchedule(blocks: ItineraryBlock[]) {
  const sorted = [...blocks].sort((a, b) => timeSortValue(a.time) - timeSortValue(b.time));
  const scheduled: Array<{ block: ItineraryBlock; start: number; duration: number }> = [];

  for (const block of sorted) {
    const originalStart = timeSortValue(block.time);
    const durationMinutes = defaultDuration(block);
    const isFixedStart = block.category === "event" && originalStart < 9999;
    const previous = scheduled.at(-1);
    const previousEnd = previous ? previous.start + previous.duration + bufferBetween(previous.block, block) : 0;

    if (isFixedStart && previousEnd > originalStart) {
      let cursor = originalStart;

      for (let index = scheduled.length - 1; index >= 0; index -= 1) {
        const prior = scheduled[index];
        if (prior.block.category === "event") break;

        const nextBlock = scheduled[index + 1]?.block || block;
        const latestStart = cursor - prior.duration - bufferBetween(prior.block, nextBlock);
        if (prior.start > latestStart) {
          const oldTime = prior.block.time;
          prior.start = latestStart;
          prior.block = {
            ...prior.block,
            time: timeLabelFromMinutes(latestStart),
            timingNote: `Moved earlier from ${oldTime} to protect the fixed event start.`,
          };
        }
        cursor = prior.start;
      }
    }

    const updatedPrevious = scheduled.at(-1);
    const updatedPreviousEnd = updatedPrevious
      ? updatedPrevious.start + updatedPrevious.duration + bufferBetween(updatedPrevious.block, block)
      : 0;
    const nextStart = isFixedStart ? originalStart : Math.max(originalStart, updatedPreviousEnd);
    const adjustedBlock: ItineraryBlock = {
      ...block,
      time: timeLabelFromMinutes(nextStart),
      durationMinutes,
    };

    if (nextStart > originalStart && originalStart < 9999) {
      adjustedBlock.timingNote = `Shifted from ${block.time} to keep the day realistic.`;
    }

    scheduled.push({ block: adjustedBlock, start: nextStart, duration: durationMinutes });
  }

  return scheduled
    .sort((a, b) => a.start - b.start)
    .map(({ block, start, duration }) => ({ ...block, time: timeLabelFromMinutes(start), durationMinutes: duration }));
}

function buildBlocks(date: string, dayIndex: number, input: PlannerInput, events: VegasEvent[]): ItineraryBlock[] {
  const attraction = pickStop(attractionStops, input, dayIndex);
  const freeExperience = pickStop(freeExperienceStops, input, dayIndex);
  const secondFreeExperience = pickStop(freeExperienceStops, input, dayIndex + 3);
  const dinner = pickRestaurant(input, dayIndex + 2);
  const lunchRestaurant = pickRestaurant(input, dayIndex + 6);
  const casino = pickStop(casinoStops, input, dayIndex);
  const dayEvents = eventsForDay(events, date, input);
  const mainEvent = dayEvents[0];
  const text = textFor(input);
  const slowMorning = text.includes("slow morning");
  const packed = text.includes("packed");
  const noGambling = text.includes("no gambling");
  const shoppingFocused = text.includes("shopping") || text.includes("shop");
  const freeFocused = text.includes("free") || text.includes("cheap") || text.includes("budget") || text.includes("under");
  const flexibleLodging = lodgingIsFlexible(input);
  const mainEventStart = eventStartMinutes(mainEvent);
  const dinnerTime = mainEventStart && mainEventStart >= 18 * 60 ? timeLabelFromMinutes(Math.max(16 * 60 + 30, mainEventStart - 150)) : "6:00 PM";

  const blocks: ItineraryBlock[] = [
    {
      time: slowMorning ? "12:00 PM" : "11:00 AM",
      title: lunchRestaurant.name,
      category: "meal",
      location: lunchRestaurant.venue || lunchRestaurant.area,
      description: lunchRestaurant.description,
      bookingUrl: lunchRestaurant.reservationUrl,
      durationMinutes: 90,
    },
    {
      time: slowMorning ? "2:00 PM" : "1:00 PM",
      title: shoppingFocused || freeFocused ? freeExperience.name : attraction.name,
      category: shoppingFocused ? "shopping" : shoppingFocused || freeFocused ? "free" : "attraction",
      location: shoppingFocused || freeFocused ? freeExperience.area : attraction.area,
      description: shoppingFocused || freeFocused ? freeExperience.description : attraction.description,
      durationMinutes: shoppingFocused || freeFocused ? 75 : 90,
    },
    noGambling
      ? {
          time: "4:00 PM",
          title: secondFreeExperience.name,
          category: secondFreeExperience.tags.includes("shopping") ? "shopping" : "free",
          location: secondFreeExperience.area,
          description: "Keeps the plan Vegas-feeling without forcing casino time. " + secondFreeExperience.description,
          durationMinutes: 75,
        }
      : {
          time: "4:00 PM",
          title: casino.name,
          category: "casino",
          location: casino.area,
          description: casino.description,
          durationMinutes: 75,
        },
    {
      time: dinnerTime,
      title: dinner.name,
      category: "meal",
      location: dinner.venue || dinner.area,
      description: dinner.description,
      bookingUrl: dinner.reservationUrl,
      durationMinutes: 90,
    },
  ];

  if (flexibleLodging && dayIndex === 0) {
    blocks.unshift({
      time: slowMorning ? "11:15 AM" : "10:15 AM",
      title: "Lodging target before you book",
      category: "free",
      location: mainEvent?.venueName || freeExperience.area,
      description: lodgingRecommendation(input, mainEvent),
      durationMinutes: 45,
    });
  }

  if (mainEvent) {
    blocks.push({
      time: eventTime(mainEvent, "8:00 PM"),
      title: mainEvent.name,
      category: "event",
      location: mainEvent.venueName,
      description: mainEvent.quickVerdict,
      bookingUrl: mainEvent.affiliateUrl,
      priceHint: priceHint(mainEvent),
      durationMinutes: mainEvent.runtimeMinutes || (mainEvent.category === "sports" || mainEvent.category === "concerts" ? 180 : 120),
    });
  } else {
    blocks.push({
      time: "8:00 PM",
      title: "Open evening for a last-minute show or lounge",
      category: "free",
      description: "Keep this block flexible until live inventory or group energy makes the best choice obvious.",
      durationMinutes: 120,
    });
  }

  blocks.push({
    time: "10:30 PM",
    title: noGambling ? "Dessert, views, or a walkable lounge nearby" : secondFreeExperience.name,
    category: noGambling ? "free" : secondFreeExperience.tags.includes("shopping") ? "shopping" : "free",
    location: mainEvent?.venueName || dinner.area,
    description: noGambling
      ? "Keep the final stop close to avoid long rides after the main event."
      : `Use this as a flexible, non-ticketed decompression stop. ${secondFreeExperience.description}`,
    durationMinutes: 60,
  });

  if (packed) {
    blocks.splice(2, 0, {
      time: "3:00 PM",
      title: freeExperience.name,
      category: freeExperience.tags.includes("shopping") ? "shopping" : "free",
      location: freeExperience.area,
      description: "A short, no-ticket bonus stop added because you asked for a fuller schedule. " + freeExperience.description,
      durationMinutes: 60,
    });
  }

  return sanitizeSchedule(blocks);
}

function timeSortValue(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 9999;

  const [, rawHour, rawMinute, period] = match;
  let hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

function dayTheme(dayIndex: number, event?: VegasEvent) {
  if (dayIndex === 0) return "Arrival, orientation, and one strong anchor";
  if (event?.category === "sports") return "Arena energy and easy post-game logistics";
  if (event?.category === "concerts") return "Dinner, headline energy, and late-night momentum";
  if (event?.category === "comedy") return "Flexible day, easy laughs, and low-friction nightlife";
  return "Balanced Vegas day with food, free exploring, optional gambling, and a main event";
}

export function buildItinerary({ plannerInput, startDate, endDate, rankedEvents }: BuildItineraryInput): ItineraryDay[] {
  const dates = dateRange(startDate, endDate);
  const itineraryDates = dates.length > 0 ? dates : [new Date().toISOString().slice(0, 10)];

  return itineraryDates.map((date, index) => {
    const dayEvents = eventsForDay(rankedEvents, date, plannerInput);

    return {
      date,
      label: formatDayLabel(date),
      theme: dayTheme(index, dayEvents[0]),
      blocks: buildBlocks(date, index, plannerInput, rankedEvents),
    };
  });
}
