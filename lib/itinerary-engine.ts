import { attractionStops, casinoStops, freeExperienceStops, PlanningStop } from "@/data/planning-stops";
import { goCityFlexibleAttractions } from "@/data/go-city-attractions";
import { RestaurantMealPeriod, restaurants, VegasRestaurant } from "@/data/restaurants";
import { VegasEvent } from "@/types/event";
import { ItineraryBlock, ItineraryDay, PlannerInput } from "@/types/planner";
import { mealLevelsFromText, ticketBandsFromText } from "@/lib/budget-preferences";
import { estimateVegasTravel } from "@/lib/vegas-logistics";
import { isAgeRestrictedEvent, isHeadlineEvent, scoreEvent } from "@/lib/scoring";
import { canonicalEventKey } from "@/lib/event-identity";

// Arrival day starts with a protected check-in buffer: 3:30 PM for 90 minutes.
const ARRIVAL_BLOCK_START = 15 * 60 + 30;
const ARRIVAL_BLOCK_DURATION = 90;
const ARRIVAL_BLOCK_END = ARRIVAL_BLOCK_START + ARRIVAL_BLOCK_DURATION;
// Floor for a block trimmed to clear a fixed event start; below this the stop
// is not worth keeping on the plan.
const MIN_TRIMMED_DURATION = 45;
const goCityPlanningStops: PlanningStop[] = goCityFlexibleAttractions.map((item) => ({
  name: item.name,
  area: item.area,
  tags: [...item.tags, "go city", ...item.passTypes],
  budget: item.retailValue <= 35 ? "value" : item.retailValue >= 100 ? "premium" : "mid",
  description: `${item.name} is included with eligible Go City passes. Confirm current inclusion${item.reservationRequired ? " and reservation requirements" : ""} before visiting.`,
  provider: "go-city",
  passTypes: item.passTypes,
  bookingUrl: item.bookingUrl,
  retailValue: item.retailValue,
  reservationRequired: item.reservationRequired,
  durationMinutes: item.durationMinutes,
}));
const paidAttractionStops = [...attractionStops, ...goCityPlanningStops];

type BuildItineraryInput = {
  plannerInput: PlannerInput;
  startDate?: string;
  endDate?: string;
  rankedEvents: VegasEvent[];
  /**
   * Curated picks offered by name when a day has no confirmed provider anchor.
   * These carry no verified showtime, so they are never scheduled as a timed
   * block; they only tell the visitor what is worth looking up.
   */
  eveningSuggestions?: VegasEvent[];
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

// Qualitative intent lives in what the visitor typed or picked as a vibe.
// Quantitative fields (ticket budget, meal budget) are parsed as bands by
// budget-preferences and must not leak keywords into intent flags: the ticket
// chip "Under $100 per person" once set the free-focus flag through the word
// "under" and silently deleted the paid attraction from every day.
function intentTextFor(input: PlannerInput) {
  return `${input.prompt || ""} ${input.vibe || ""} ${input.additionalDetails || ""}`.toLowerCase();
}

const FREE_FOCUS_PATTERN = /\b(free|cheap|no[- ]tickets?|budget[- ]friendly|on a budget|low[- ]cost)\b/;

// "Flexible daytime stops" describes free daytime filler, not a daytime
// headliner. Only an explicit daytime-event intent lowers the anchor floor
// below the evening hours.
const DAYTIME_ANCHOR_PATTERN = /\b(day ?club|day ?party|pool party|brunch|matinee|(daytime|afternoon) (show|event|party|headliner))\b/;

function isFamilyGroup(input: PlannerInput) {
  return (input.groupType || "").toLowerCase().includes("family");
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
  // The ticket-budget chip is a quantitative band. Parse it as one instead of
  // keyword-matching the label, which read "Under $100 per person" as a
  // request for value-tier everything. A mixed selection maps to its highest
  // band, since the visitor has said they will pay that much for the right pick.
  const bands = ticketBandsFromText(input.budget);
  if (bands.length > 0) {
    if (bands.includes("350-plus") || bands.includes("200-350")) return "premium";
    if (bands.includes("100-200")) return "mid";
    return "value";
  }

  const text = intentTextFor(input);
  if (FREE_FOCUS_PATTERN.test(text) || text.includes("value") || text.includes("$50")) return "value";
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
  const requestText = textFor(input);
  const explicitlyRequested = ranked.filter((stop) => requestText.includes(stop.name.toLowerCase()));
  if (explicitlyRequested.length > 0) return explicitlyRequested[offset % explicitlyRequested.length];
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

function pickRestaurant(input: PlannerInput, offset: number, mealPeriod: RestaurantMealPeriod) {
  const eligible = restaurants.filter((restaurant) => restaurant.mealTypes.includes(mealPeriod));
  const ranked = [...eligible].sort((a, b) => scoreRestaurant(b, input) - scoreRestaurant(a, input));
  return ranked[offset % ranked.length];
}

const DEFAULT_SERVICE_WINDOWS: Record<RestaurantMealPeriod, { earliestStartMinutes: number; latestStartMinutes: number }> = {
  breakfast: { earliestStartMinutes: 7 * 60, latestStartMinutes: 10 * 60 + 30 },
  brunch: { earliestStartMinutes: 9 * 60, latestStartMinutes: 13 * 60 + 30 },
  lunch: { earliestStartMinutes: 11 * 60, latestStartMinutes: 14 * 60 + 30 },
  dinner: { earliestStartMinutes: 16 * 60 + 30, latestStartMinutes: 21 * 60 },
  "late night": { earliestStartMinutes: 21 * 60, latestStartMinutes: 23 * 60 + 30 },
};

function serviceWindowFor(restaurant: VegasRestaurant, mealPeriod: RestaurantMealPeriod) {
  return restaurant.serviceWindows?.[mealPeriod] || DEFAULT_SERVICE_WINDOWS[mealPeriod];
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

export function isGoodAnchorEvent(event: VegasEvent, input: PlannerInput, isArrivalDay = false) {
  const hour = hourForEvent(event);
  const wantsDaytimeAnchor = DAYTIME_ANCHOR_PATTERN.test(intentTextFor(input));

  if (!isHeadlineEvent(event)) return false;
  if (isFamilyGroup(input) && isAgeRestrictedEvent(event)) return false;
  if (!eventMatchesIntent(event, input)) return false;
  if (hour === undefined) return false;
  if (isArrivalDay) return hour >= 19;
  if (wantsDaytimeAnchor) return hour >= 11;

  return hour >= 17;
}

function eventsForDay(
  events: VegasEvent[],
  date: string,
  input: PlannerInput,
  usedEventKeys = new Set<string>(),
  isArrivalDay = false,
  usedVenueNames = new Set<string>(),
) {
  const dated = events.filter((event) => event.localDate === date);
  const anchorable = dated.filter(
    (event) => isGoodAnchorEvent(event, input, isArrivalDay) && !usedEventKeys.has(canonicalEventKey(event)),
  );

  const bestMatch = anchorable[0];
  if (!bestMatch || !usedVenueNames.has(bestMatch.venueName.toLowerCase())) return anchorable;

  // Prefer a fresh venue only when it remains close to the best recommendation.
  // Variety should not replace a strong match with a materially weaker event.
  const freshVenue = anchorable.find((event) => !usedVenueNames.has(event.venueName.toLowerCase()));
  if (!freshVenue || scoreEvent(bestMatch, input) - scoreEvent(freshVenue, input) > 10) return anchorable;

  return [freshVenue, ...anchorable.filter((event) => event.id !== freshVenue.id)];
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

function roundUpToQuarter(totalMinutes: number) {
  return Math.ceil(totalMinutes / 15) * 15;
}

function roundDownToQuarter(totalMinutes: number) {
  return Math.floor(totalMinutes / 15) * 15;
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
  if (!block.location || !nextBlock?.location) return roundUpToQuarter(activityBuffer);

  const travel = estimateVegasTravel(block.location, nextBlock.location);
  return roundUpToQuarter(Math.max(activityBuffer, travel.maxMinutes + 5));
}

function minimumUsefulDuration(block: ItineraryBlock) {
  return block.category === "meal" ? 75 : MIN_TRIMMED_DURATION;
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
        const beforePrior = scheduled[index - 1];
        // Never pull a block earlier than its own floor, or back over the block
        // in front of it - making room for the event must not create an overlap.
        const earliestAllowed = Math.max(
          prior.block.earliestStartMinutes ?? Number.NEGATIVE_INFINITY,
          beforePrior
            ? beforePrior.start + beforePrior.duration + bufferBetween(beforePrior.block, prior.block)
            : Number.NEGATIVE_INFINITY,
        );
        const latestStart = Math.max(
          roundDownToQuarter(cursor - prior.duration - bufferBetween(prior.block, nextBlock)),
          earliestAllowed,
        );
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

      // Shifting earlier is bounded by floors and by the preceding block, so a
      // tight day can still leave the last stop running into the event. Trim it
      // rather than publish overlapping times.
      let trailing = scheduled.at(-1);
      while (trailing && trailing.block.category !== "event") {
        const mustEndBy = originalStart - bufferBetween(trailing.block, block);
        if (trailing.start + trailing.duration <= mustEndBy) break;

        const availableDuration = roundDownToQuarter(mustEndBy - trailing.start);
        if (availableDuration < minimumUsefulDuration(trailing.block)) {
          scheduled.pop();
          trailing = scheduled.at(-1);
          continue;
        }

        trailing.duration = availableDuration;
        trailing.block = {
          ...trailing.block,
          durationMinutes: availableDuration,
          timingNote: `Shortened to keep the ${block.title} start time.`,
        };
        break;
      }
    }

    const updatedPrevious = scheduled.at(-1);
    const updatedPreviousEnd = updatedPrevious
      ? updatedPrevious.start + updatedPrevious.duration + bufferBetween(updatedPrevious.block, block)
      : 0;
    const nextStart = isFixedStart ? originalStart : roundUpToQuarter(Math.max(originalStart, updatedPreviousEnd));
    if (block.latestStartMinutes !== undefined && nextStart > block.latestStartMinutes) continue;
    const adjustedBlock: ItineraryBlock = {
      ...block,
      time: timeLabelFromMinutes(nextStart),
      durationMinutes,
    };

    if (nextStart - originalStart >= 15 && originalStart < 9999) {
      adjustedBlock.timingNote = `Shifted from ${block.time} to keep the day realistic.`;
    }

    scheduled.push({ block: adjustedBlock, start: nextStart, duration: durationMinutes });
  }

  return scheduled
    .sort((a, b) => a.start - b.start)
    .map(({ block, start, duration }) => ({ ...block, time: timeLabelFromMinutes(start), durationMinutes: duration }));
}

function formatList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} or ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, or ${values.at(-1)}`;
}

function buildBlocks(dayIndex: number, input: PlannerInput, mainEvent?: VegasEvent, eveningSuggestions?: VegasEvent[]): ItineraryBlock[] {
  const attraction = pickStop(paidAttractionStops, input, dayIndex);
  const freeExperience = pickStop(freeExperienceStops, input, dayIndex);
  const secondFreeExperience = pickStop(freeExperienceStops, input, dayIndex + 3);
  const standardDinner = pickRestaurant(input, dayIndex + 2, "dinner");
  const lateNightDinner = pickRestaurant(input, dayIndex + 2, "late night");
  const lunchRestaurant = pickRestaurant(input, dayIndex + 6, "lunch");
  const casino = pickStop(casinoStops, input, dayIndex);
  const text = textFor(input);
  const isArrivalDay = dayIndex === 0;
  const slowMorning = text.includes("slow morning");
  const packed = text.includes("packed");
  const noGambling = text.includes("no gambling");
  const shoppingFocused = text.includes("shopping") || text.includes("shop");
  const freeFocused = FREE_FOCUS_PATTERN.test(intentTextFor(input));
  const flexibleLodging = lodgingIsFlexible(input);
  const mainEventStart = eventStartMinutes(mainEvent);
  const mainEventDuration = mainEvent?.runtimeMinutes || (mainEvent?.category === "sports" || mainEvent?.category === "concerts" ? 180 : 120);
  const standardDinnerLocation = standardDinner.venue || standardDinner.area;
  const standardDinnerTimingBlock: ItineraryBlock = {
    time: "",
    title: standardDinner.name,
    category: "meal",
    location: standardDinnerLocation,
  };
  const eventTimingBlock: ItineraryBlock | undefined = mainEvent
    ? {
        time: "",
        title: mainEvent.name,
        category: "event",
        location: mainEvent.venueName,
      }
    : undefined;
  const arrivalTimingBlock: ItineraryBlock = {
    time: "",
    title: "Arrival, hotel check-in, and reset",
    category: "free",
    location: input.stayingNear && !flexibleLodging ? input.stayingNear : undefined,
  };
  // Vegas nights run dinner-then-show. Push dinner after the anchor only when
  // there is genuinely no room before it, otherwise an early anchor cascades
  // into a 10:45 PM dinner and a 1:00 AM last stop.
  const DINNER_MINUTES = 90;
  const arrivalToDinnerBuffer = isArrivalDay ? bufferBetween(arrivalTimingBlock, standardDinnerTimingBlock) : 0;
  const dinnerToEventBuffer = eventTimingBlock ? bufferBetween(standardDinnerTimingBlock, eventTimingBlock) : 30;
  const earliestDinner = isArrivalDay ? ARRIVAL_BLOCK_END + arrivalToDinnerBuffer : 16 * 60 + 30;
  const dinnerFitsBeforeEvent =
    mainEventStart !== undefined && mainEventStart - earliestDinner >= DINNER_MINUTES + dinnerToEventBuffer;
  const dinnerPeriod: RestaurantMealPeriod = mainEventStart !== undefined && !dinnerFitsBeforeEvent ? "late night" : "dinner";
  const dinner = dinnerPeriod === "late night" ? lateNightDinner : standardDinner;
  const dinnerLocation = dinner.venue || dinner.area;
  const dinnerTimingBlock: ItineraryBlock = {
    time: "",
    title: dinner.name,
    category: "meal",
    location: dinnerLocation,
  };
  const eventToDinnerBuffer = eventTimingBlock ? bufferBetween(eventTimingBlock, dinnerTimingBlock) : 30;
  const dinnerWindow = serviceWindowFor(dinner, dinnerPeriod);
  const proposedDinnerStart = mainEventStart === undefined
    ? 18 * 60
    : dinnerFitsBeforeEvent
      ? Math.max(earliestDinner, mainEventStart - (DINNER_MINUTES + dinnerToEventBuffer))
      : mainEventStart + mainEventDuration + eventToDinnerBuffer;
  const dinnerStart = Math.max(proposedDinnerStart, dinnerWindow.earliestStartMinutes);
  const dinnerTime = timeLabelFromMinutes(dinnerStart);
  const dinnerIsCredible = dinnerStart < 24 * 60 && dinnerStart <= dinnerWindow.latestStartMinutes;
  const mainEventEnd = mainEventStart === undefined
    ? undefined
    : dinnerFitsBeforeEvent
      ? mainEventStart + mainEventDuration
      : mainEventStart + mainEventDuration + (dinnerIsCredible ? DINNER_MINUTES + eventToDinnerBuffer : 0);
  // A nightcap stop is only worth scheduling if it lands at a sane hour.
  const lateStopFits = mainEventEnd === undefined || mainEventEnd <= 22 * 60 + 30;

  const daytimeBlocks: ItineraryBlock[] = isArrivalDay
    ? [
        {
          time: timeLabelFromMinutes(ARRIVAL_BLOCK_START),
          title: "Arrival, hotel check-in, and reset",
          category: "free",
          location: input.stayingNear && !flexibleLodging ? input.stayingNear : undefined,
          description: "Protected arrival time for airport delays, baggage, hotel check-in, and getting settled before the first real plan.",
          durationMinutes: ARRIVAL_BLOCK_DURATION,
          earliestStartMinutes: ARRIVAL_BLOCK_START,
        },
      ]
    : [
        {
          time: slowMorning ? "12:00 PM" : "11:30 AM",
          title: lunchRestaurant.name,
          category: "meal",
          location: lunchRestaurant.venue || lunchRestaurant.area,
          description: lunchRestaurant.description,
          bookingUrl: lunchRestaurant.reservationUrl,
          durationMinutes: 90,
          earliestStartMinutes: serviceWindowFor(lunchRestaurant, "lunch").earliestStartMinutes,
          latestStartMinutes: serviceWindowFor(lunchRestaurant, "lunch").latestStartMinutes,
        },
        {
          time: slowMorning ? "2:00 PM" : "1:00 PM",
          title: shoppingFocused || freeFocused ? freeExperience.name : attraction.name,
          category: shoppingFocused ? "shopping" : shoppingFocused || freeFocused ? "free" : "attraction",
          location: shoppingFocused || freeFocused ? freeExperience.area : attraction.area,
          description: shoppingFocused || freeFocused ? freeExperience.description : attraction.description,
          durationMinutes: shoppingFocused || freeFocused ? 75 : attraction.durationMinutes || 90,
          bookingUrl: shoppingFocused || freeFocused ? undefined : attraction.bookingUrl,
          priceHint: !shoppingFocused && !freeFocused && attraction.provider === "go-city"
            ? `Included with Go City; retail value up to $${attraction.retailValue}`
            : undefined,
          provider: shoppingFocused || freeFocused ? undefined : attraction.provider,
          passTypes: shoppingFocused || freeFocused ? undefined : attraction.passTypes,
          providerBookingUrl: shoppingFocused || freeFocused ? undefined : attraction.bookingUrl,
          reservationRequired: shoppingFocused || freeFocused ? undefined : attraction.reservationRequired,
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
      ];

  const blocks: ItineraryBlock[] = [
    ...daytimeBlocks,
    ...(dinnerIsCredible ? [{
      time: dinnerTime,
      title: dinner.name,
      category: "meal",
      location: dinnerLocation,
      description: dinner.description,
      bookingUrl: dinner.reservationUrl,
      durationMinutes: 90,
      earliestStartMinutes: dinnerWindow.earliestStartMinutes,
      latestStartMinutes: dinnerWindow.latestStartMinutes,
      timingNote: dinnerPeriod === "late night" ? "Late-night food selected because a full dinner does not fit before the event." : undefined,
    } satisfies ItineraryBlock] : []),
  ];

  if (flexibleLodging && dayIndex === 0) {
    blocks.unshift({
      time: "2:30 PM",
      title: "Lodging target before you book",
      category: "free",
      location: mainEvent?.venueName || freeExperience.area,
      description: lodgingRecommendation(input, mainEvent),
      durationMinutes: 45,
    });
  }

  if (mainEvent) {
    blocks.push({
      time: eventTime(mainEvent, "7:00 PM"),
      title: mainEvent.name,
      category: "event",
      location: mainEvent.venueName,
      description: mainEvent.quickVerdict,
      bookingUrl: mainEvent.affiliateUrl,
      priceHint: priceHint(mainEvent),
      durationMinutes: mainEventDuration,
    });
  } else {
    const suggestionNames = (eveningSuggestions || []).slice(0, 3).map((event) => event.name);
    const suggestionSentence = suggestionNames.length > 0
      ? ` Worth checking tonight's showtimes for ${formatList(suggestionNames)}.`
      : "";

    blocks.push({
      time: "8:00 PM",
      title: "Open evening for a last-minute show or lounge",
      category: "free",
      // Named without times on purpose: no performance time has been confirmed
      // for these, so presenting one would invent schedule data.
      description: `Keep this block flexible until live inventory or group energy makes the best choice obvious.${suggestionSentence}`,
      durationMinutes: 120,
    });
  }

  if (lateStopFits) blocks.push({
    time: "10:30 PM",
    title: noGambling ? "Dessert, views, or a walkable lounge nearby" : secondFreeExperience.name,
    category: noGambling ? "free" : secondFreeExperience.tags.includes("shopping") ? "shopping" : "free",
    location: noGambling ? mainEvent?.venueName || dinner.area : secondFreeExperience.area,
    description: noGambling
      ? "Keep the final stop close to avoid long rides after the main event."
      : `Use this as a flexible, non-ticketed decompression stop. ${secondFreeExperience.description}`,
    durationMinutes: 60,
  });

  if (packed && !isArrivalDay) {
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
  if (dayIndex === 0) return event ? "Arrival, check-in buffer, and one strong evening anchor" : "Arrival, check-in, and a flexible first night";
  if (event?.category === "sports") return "Arena energy and easy post-game logistics";
  if (event?.category === "concerts") return "Dinner, headline energy, and late-night momentum";
  if (event?.category === "comedy") return "Flexible day, easy laughs, and low-friction nightlife";
  if (event?.category === "shows") return `A well-paced Vegas day built around ${event.name}`;
  if (dayIndex % 2 === 0) return "A slower start, destination dining, and flexible Vegas exploring";
  return "A classic Strip day with lunch, sightseeing, and an open evening";
}

export function buildItinerary({ plannerInput, startDate, endDate, rankedEvents, eveningSuggestions }: BuildItineraryInput): ItineraryDay[] {
  const dates = dateRange(startDate, endDate);
  const itineraryDates = dates.length > 0 ? dates : [new Date().toISOString().slice(0, 10)];

  const usedEventKeys = new Set<string>();
  const usedVenueNames = new Set<string>();

  return itineraryDates.map((date, index) => {
    const mainEvent = eventsForDay(rankedEvents, date, plannerInput, usedEventKeys, index === 0, usedVenueNames)[0];
    if (mainEvent) {
      usedEventKeys.add(canonicalEventKey(mainEvent));
      usedVenueNames.add(mainEvent.venueName.toLowerCase());
    }

    return {
      date,
      label: formatDayLabel(date),
      theme: dayTheme(index, mainEvent),
      blocks: buildBlocks(index, plannerInput, mainEvent, eveningSuggestions),
    };
  });
}
