import { expect, test } from "vitest";
import { buildItinerary } from "@/lib/itinerary-engine";
import { groupKindFrom, readPreferences } from "@/lib/planner-preferences";
import { VegasEvent } from "@/types/event";
import { PlannerInput } from "@/types/planner";

const ARENA_ADVICE = /Park MGM, NYNY, Aria/;
const SPHERE_ADVICE = /Venetian, Palazzo, Wynn/;
const FAMILY_ADVICE = /center Strip or south Strip/;
const DEFAULT_ADVICE = /easiest first-trip logistics/;

/**
 * The lodging recommendation is the most visible consumer of planner answers, so
 * it is the clearest place to assert that one answer cannot rewrite advice that
 * belongs to another. It only renders while lodging is still flexible.
 */
function lodgingAdvice(overrides: Partial<PlannerInput>, rankedEvents: VegasEvent[] = []) {
  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-09-04 to 2026-09-05",
      // Flexibility is declared in typed text rather than the stay-area answer,
      // so tests can vary that answer independently.
      additionalDetails: "we have not booked lodging yet",
      ...overrides,
    },
    startDate: "2026-09-04",
    endDate: "2026-09-05",
    rankedEvents,
  });
  const block = days[0].blocks.find((item) => item.title === "Lodging target before you book");
  if (!block?.description) throw new Error("Expected a lodging recommendation block");
  return block.description;
}

test("a gambling answer cannot rewrite the lodging recommendation", () => {
  // "Casino atmosphere only" contains "atmo(sphere)", and the engine used to
  // match "sphere" against every field concatenated together, so asking for
  // casino ambience produced Sphere-adjacent lodging advice.
  expect(lodgingAdvice({ gamblingPreference: "Casino atmosphere only" })).toMatch(DEFAULT_ADVICE);
  // "Sportsbook" contains "sports", which used to produce arena lodging advice.
  expect(lodgingAdvice({ gamblingPreference: "Sportsbook" })).toMatch(DEFAULT_ADVICE);
  expect(lodgingAdvice({ gamblingPreference: "Table games" })).toMatch(DEFAULT_ADVICE);
});

test("a pace answer cannot rewrite the lodging recommendation", () => {
  // "Family-friendly pace" contains "family". Pace describes scheduling, not
  // who is travelling, so only the group answer may select family advice.
  expect(lodgingAdvice({ pace: "Family-friendly pace" })).toMatch(DEFAULT_ADVICE);
  expect(lodgingAdvice({ groupType: "family with teens" })).toMatch(FAMILY_ADVICE);
});

test("lodging and typed intent still drive the lodging recommendation", () => {
  expect(lodgingAdvice({ stayingNear: "near Sphere" })).toMatch(SPHERE_ADVICE);
  expect(lodgingAdvice({ stayingNear: "near T-Mobile Arena" })).toMatch(ARENA_ADVICE);
  expect(lodgingAdvice({ prompt: "we are going Downtown for Fremont Street" })).toMatch(/Downtown\/Fremont/);
  expect(lodgingAdvice({ prompt: "we want a big arena night" })).toMatch(ARENA_ADVICE);
});

test("a scheduled arena anchor still drives the lodging recommendation", () => {
  const arenaShow: VegasEvent = {
    id: "ticketmaster-arena",
    name: "Golden Knights home game",
    slug: "golden-knights-home-game",
    category: "sports",
    venueName: "T-Mobile Arena",
    area: "South Strip",
    localDate: "2026-09-04",
    // Arrival day only anchors on a 7 PM or later start.
    localTime: "20:00:00",
    runtimeMinutes: 150,
    tags: ["sports"],
    bestFor: ["Sports fans"],
    skipIf: [],
    shortDescription: "A real game.",
    quickVerdict: "A confirmed arena night.",
    affiliateUrl: "https://example.com/tickets",
    editorialScore: 90,
    valueScore: 80,
    wowScore: 90,
    familyScore: 70,
    couplesScore: 70,
    bachelorScore: 90,
  };

  // Nothing typed mentions sports; the venue alone must select arena advice.
  expect(lodgingAdvice({ prompt: "one strong night" }, [arenaShow])).toMatch(ARENA_ADVICE);
  expect(lodgingAdvice({ prompt: "one strong night" })).toMatch(DEFAULT_ADVICE);
});

test("quantitative budget labels stay out of the intent flags", () => {
  // "Under $100 per person" carries the word "under", which once set the
  // free-focus flag and deleted the paid attraction from every day.
  const priced = readPreferences({ travelDates: "", budget: "Under $100 per person" });
  expect(priced.freeFocus).toBe(false);
  expect(priced.budgetTier).toBe("value");

  // A meal-budget label mentioning "casual" must not register as a food
  // affinity; the food answer is where that belongs.
  const meal = readPreferences({ travelDates: "", mealBudget: "Mostly casual meals under $40 per person" });
  expect(meal.affinityText).toBe("");
  expect(meal.freeFocus).toBe(false);

  const typedFreeIntent = readPreferences({ travelDates: "", prompt: "cheap free things to do" });
  expect(typedFreeIntent.freeFocus).toBe(true);
});

test("a mixed ticket selection takes its highest band", () => {
  const mixed = readPreferences({ travelDates: "", budget: "Under $100 per person, $200-$350 per person" });
  expect(mixed.ticketBands).toEqual(["under-100", "200-350"]);
  expect(mixed.budgetTier).toBe("premium");
});

test("group answers map to one shared group kind", () => {
  expect(groupKindFrom("family with teens")).toBe("family");
  expect(groupKindFrom("bachelor party")).toBe("bachelor");
  // Checked before "friends" so a bachelorette group is not read as friends.
  expect(groupKindFrom("bachelorette party with friends")).toBe("bachelor");
  expect(groupKindFrom("couple")).toBe("couple");
  expect(groupKindFrom("friends trip")).toBe("friends");
  expect(groupKindFrom(undefined)).toBe("unspecified");
  // Pace is not a group answer.
  expect(groupKindFrom("Family-friendly pace")).toBe("family");
});

test("pace flags read the pace answer or typed intent, nothing else", () => {
  expect(readPreferences({ travelDates: "", pace: "Slow mornings" }).slowMornings).toBe(true);
  expect(readPreferences({ travelDates: "", prompt: "we want a slow morning" }).slowMornings).toBe(true);
  expect(readPreferences({ travelDates: "", pace: "Packed schedule" }).packedSchedule).toBe(true);
  expect(readPreferences({ travelDates: "", pace: "Balanced" }).packedSchedule).toBe(false);
  expect(readPreferences({ travelDates: "", pace: "Balanced" }).slowMornings).toBe(false);
});

test("gambling stance distinguishes declining from wanting atmosphere", () => {
  expect(readPreferences({ travelDates: "", gamblingPreference: "No gambling" }).avoidsGambling).toBe(true);
  expect(readPreferences({ travelDates: "", prompt: "no gambling please" }).avoidsGambling).toBe(true);
  // Atmosphere is not a refusal: the casino stop stays on the plan.
  const atmosphere = readPreferences({ travelDates: "", gamblingPreference: "Casino atmosphere only" });
  expect(atmosphere.gambling).toBe("atmosphere-only");
  expect(atmosphere.avoidsGambling).toBe(false);
  expect(readPreferences({ travelDates: "", gamblingPreference: "Poker" }).gambling).toBe("plays");
  expect(readPreferences({ travelDates: "" }).gambling).toBe("unspecified");
});

test("a declined-gambling plan swaps the casino stop for a free one", () => {
  const [, secondDay] = buildItinerary({
    plannerInput: { travelDates: "2026-09-04 to 2026-09-06", gamblingPreference: "No gambling" },
    startDate: "2026-09-04",
    endDate: "2026-09-06",
    rankedEvents: [],
  });
  expect(secondDay.blocks.some((block) => block.category === "casino")).toBe(false);

  const [, gamblingDay] = buildItinerary({
    plannerInput: { travelDates: "2026-09-04 to 2026-09-06", gamblingPreference: "Casino atmosphere only" },
    startDate: "2026-09-04",
    endDate: "2026-09-06",
    rankedEvents: [],
  });
  expect(gamblingDay.blocks.some((block) => block.category === "casino")).toBe(true);
});
