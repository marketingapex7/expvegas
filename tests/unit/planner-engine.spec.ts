import { expect, test } from "vitest";
import { buildItinerary, isGoodAnchorEvent, sanitizeSchedule } from "@/lib/itinerary-engine";
import { generatePlannerResponse, plannerInventoryEndDate } from "@/lib/planner-service";
import { VegasEvent } from "@/types/event";

function event(overrides: Partial<VegasEvent>): VegasEvent {
  return {
    id: "event",
    name: "Headline Show",
    slug: "headline-show",
    category: "shows",
    venueName: "Bellagio",
    area: "Center Strip",
    localDate: "2026-08-01",
    localTime: "21:00:00",
    runtimeMinutes: 90,
    tags: ["show", "spectacle"],
    bestFor: ["First-timers"],
    skipIf: [],
    shortDescription: "A real show.",
    quickVerdict: "A verified live show at Bellagio.",
    affiliateUrl: "https://example.com/tickets",
    editorialScore: 90,
    valueScore: 80,
    wowScore: 95,
    familyScore: 70,
    couplesScore: 90,
    bachelorScore: 70,
    ...overrides,
  };
}

function minutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!match) return -1;
  let hour = Number(match[1]);
  if (match[3] === "PM" && hour !== 12) hour += 12;
  if (match[3] === "AM" && hour === 12) hour = 0;
  return hour * 60 + Number(match[2]);
}

test("planner rejects retail popups, avoids duplicate anchors, and respects meal periods", () => {
  const events = [
    event({
      id: "popup",
      name: "AC/DC PWR UP POP UP SHOP",
      slug: "acdc-popup",
      localDate: "2026-08-01",
      localTime: "20:00:00",
      shortDescription: "Merchandise pop-up shop.",
      editorialScore: 100,
    }),
    event({ id: "show-one", localDate: "2026-08-01", localTime: "21:00:00" }),
    event({ id: "show-two", localDate: "2026-08-02", localTime: "21:00:00" }),
  ];

  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-04",
      partySize: 4,
      prompt: "Friends trip with a big Vegas spectacle",
      groupType: "friends trip",
      vibe: "big Vegas spectacle",
      stayingNear: "not booked yet",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-04",
    rankedEvents: events,
  });

  const blocks = days.flatMap((day) => day.blocks);
  const scheduledEvents = blocks.filter((block) => block.category === "event");
  expect(scheduledEvents.map((block) => block.title)).not.toContain("AC/DC PWR UP POP UP SHOP");
  expect(scheduledEvents.filter((block) => block.title === "Headline Show")).toHaveLength(1);

  expect(Math.min(...days[0].blocks.map((block) => minutes(block.time)))).toBeGreaterThanOrEqual(14 * 60 + 30);
  expect(blocks.filter((block) => block.category === "meal" && minutes(block.time) < 15 * 60).map((block) => block.title))
    .not.toContain("Golden Steer Steakhouse");
  expect(blocks.filter((block) => block.category === "meal" && minutes(block.time) >= 15 * 60).map((block) => block.title))
    .not.toContain("Eggslut");
  expect(blocks.every((block) => minutes(block.time) % 15 === 0)).toBe(true);
});

test("an early long event uses a real late-night restaurant instead of a closed dinner venue", () => {
  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-02",
      prompt: "A classic steakhouse and a headline concert",
      foodPreference: "steakhouse",
      groupType: "friends trip",
      stayingNear: "center Strip",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-02",
    rankedEvents: [
      event({
        id: "long-concert",
        category: "concerts",
        localDate: "2026-08-01",
        localTime: "19:00:00",
        runtimeMinutes: 180,
      }),
    ],
  });

  const meal = days[0].blocks.find((block) => block.category === "meal");
  expect(meal).toBeDefined();
  expect(meal?.title).not.toBe("Golden Steer Steakhouse");
  expect(minutes(meal?.time || "")).toBeGreaterThanOrEqual(21 * 60);
  expect(minutes(meal?.time || "")).toBeLessThanOrEqual(23 * 60 + 30);
});

test("canonical event identity prevents title variants from anchoring multiple days", () => {
  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-03",
      groupType: "friends trip",
      stayingNear: "center Strip",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    rankedEvents: [
      event({
        id: "first-performance",
        seriesId: "same-production",
        name: "Headline Show",
        localDate: "2026-08-01",
        localTime: "20:00:00",
      }),
      event({
        id: "second-performance",
        seriesId: "same-production",
        name: "Headline Show (21+ Event)",
        localDate: "2026-08-02",
        localTime: "20:00:00",
      }),
    ],
  });

  expect(days.flatMap((day) => day.blocks).filter((block) => block.category === "event")).toHaveLength(1);
});

test("free and shopping stops retain their own locations", () => {
  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-03",
      prompt: "A free shopping-focused Vegas trip",
      stayingNear: "center Strip",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    rankedEvents: [],
  });

  for (const block of days.flatMap((day) => day.blocks)) {
    if (block.title.includes("Forum Shops")) expect(block.location).toBe("Caesars Palace");
    if (block.title.includes("Grand Canal Shoppes")) expect(block.location).toBe("Venetian");
    if (block.title.includes("Bellagio Fountain")) expect(block.location).toBe("Bellagio");
  }
});

test("schedule sanitation removes a stop when the minimum useful duration would overlap a fixed event", () => {
  const blocks = sanitizeSchedule([
    {
      time: "6:30 PM",
      title: "Dinner that no longer fits",
      category: "meal",
      location: "Bellagio",
      durationMinutes: 90,
      earliestStartMinutes: 18 * 60 + 30,
    },
    {
      time: "7:00 PM",
      title: "Fixed headline show",
      category: "event",
      location: "Bellagio",
      durationMinutes: 120,
    },
  ]);

  expect(blocks.map((block) => block.title)).toEqual(["Fixed headline show"]);
  expect(blocks[0].time).toBe("7:00 PM");
});

test("schedule sanitation drops a meal shifted beyond its service window", () => {
  const blocks = sanitizeSchedule([
    {
      time: "8:00 PM",
      title: "Fixed headline show",
      category: "event",
      location: "Bellagio",
      durationMinutes: 180,
    },
    {
      time: "9:30 PM",
      title: "Dinner-only restaurant",
      category: "meal",
      location: "West of Strip",
      durationMinutes: 90,
      latestStartMinutes: 20 * 60 + 15,
    },
  ]);

  expect(blocks.map((block) => block.title)).toEqual(["Fixed headline show"]);
});

test("schedule sanitation keeps useful meals on quarter-hour boundaries", () => {
  const blocks = sanitizeSchedule([
    {
      time: "5:08 PM",
      title: "Dinner before the show",
      category: "meal",
      location: "Bellagio",
      durationMinutes: 90,
    },
    {
      time: "7:00 PM",
      title: "Fixed headline show",
      category: "event",
      location: "Bellagio",
      durationMinutes: 120,
    },
  ]);

  expect(blocks.map((block) => block.title)).toEqual(["Dinner before the show", "Fixed headline show"]);
  expect(blocks[0].time).toBe("5:00 PM");
  expect(blocks[0].durationMinutes).toBeGreaterThanOrEqual(75);
  expect(blocks.every((block) => minutes(block.time) % 15 === 0)).toBe(true);
});

test("planner searches through the final itinerary day, not the departure day", () => {
  expect(plannerInventoryEndDate("2026-08-01", "2026-08-08")).toBe("2026-08-07");
  expect(plannerInventoryEndDate("2026-08-01", "2026-08-01")).toBe("2026-08-01");
});

test("planner keeps editorial picks unscheduled when no provider time is confirmed", async () => {
  const configuredKey = process.env.TICKETMASTER_API_KEY;
  delete process.env.TICKETMASTER_API_KEY;

  try {
    const result = await generatePlannerResponse({
      travelDates: "2026-08-03 to 2026-08-05",
      partySize: 2,
      vibe: "classic Vegas show",
    });
    const scheduledEvents = result.itineraryDays?.flatMap((day) => day.blocks).filter((block) => block.category === "event") || [];

    expect(scheduledEvents).toHaveLength(0);
    expect(result.headline).toBe("Your Vegas Plan");
    expect(result.sourceSummary).toContain("timed plan stays flexible");
    expect(result.tripSummary?.whyThisPlanWorks).toContain("leaves the headline slot open");
  } finally {
    if (configuredKey) process.env.TICKETMASTER_API_KEY = configuredKey;
  }
});

test("day one resolves its evening exactly one way", async () => {
  const result = await generatePlannerResponse({
    travelDates: "2026-08-03 to 2026-08-05",
    partySize: 2,
    vibe: "classic Vegas with one strong anchor",
  });

  const dayOne = result.itineraryDays?.[0];
  const anchors = dayOne?.blocks.filter((block) => block.category === "event") || [];
  const openEvenings = dayOne?.blocks.filter((block) => block.title.startsWith("Open evening")) || [];

  expect(anchors.length + openEvenings.length).toBe(1);
});

test("an open evening names curated picks without inventing a showtime", async () => {
  const configuredKey = process.env.TICKETMASTER_API_KEY;
  delete process.env.TICKETMASTER_API_KEY;

  try {
    const result = await generatePlannerResponse({
      travelDates: "2026-08-03 to 2026-08-05",
      partySize: 2,
      vibe: "classic Vegas show",
    });
    const openEvening = result.itineraryDays
      ?.flatMap((day) => day.blocks)
      .find((block) => block.title.startsWith("Open evening"));

    expect(openEvening).toBeDefined();
    expect(openEvening?.description).toContain("Worth checking tonight's showtimes for");

    // The suggestion must stay a name only. A clock time here would be invented
    // schedule data, which is the reason these are not scheduled as anchors.
    const suggestionSentence = openEvening?.description?.split("Worth checking")[1] || "";
    expect(suggestionSentence).not.toMatch(/\d{1,2}:\d{2}\s*(AM|PM)?/i);
    expect(openEvening?.priceHint).toBeUndefined();
    expect(openEvening?.bookingUrl).toBeUndefined();
  } finally {
    if (configuredKey) process.env.TICKETMASTER_API_KEY = configuredKey;
  }
});

test("a ticket budget band keeps paid attractions in the plan", () => {
  // "Under $100 per person" is a ticket band, not a request for a
  // free-stops-only trip. The word "under" once leaked into the free-focus
  // flag and silently replaced the paid attraction on every non-arrival day.
  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-03",
      partySize: 4,
      prompt: "big Vegas spectacle with one standout dinner and flexible daytime stops",
      groupType: "friends trip",
      budget: "Mix ticket options across Under $100 per person and $100-$200 per person; include choices from each selection when available",
      vibe: "big Vegas spectacle",
      stayingNear: "not booked yet",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    rankedEvents: [],
  });

  const blocks = days.flatMap((day) => day.blocks);
  expect(blocks.some((block) => block.category === "attraction")).toBe(true);
});

test("a typed free-focus request still swaps attractions for free stops", () => {
  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-03",
      prompt: "keep it cheap with free things to do",
      groupType: "friends trip",
      stayingNear: "not booked yet",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    rankedEvents: [],
  });

  const blocks = days.flatMap((day) => day.blocks);
  expect(blocks.some((block) => block.category === "attraction")).toBe(false);
});

test("the word daytime in a stops request does not lower the anchor floor", () => {
  const poolParty = event({
    id: "pool-party",
    name: "The Chainsmokers (21+ Event)",
    category: "concerts",
    venueName: "Encore Beach Club",
    localDate: "2026-08-02",
    localTime: "11:00:00",
  });
  const input = {
    prompt: "big Vegas spectacle with one standout dinner and flexible daytime stops",
    vibe: "big Vegas spectacle",
    groupType: "friends trip",
  };

  // "Flexible daytime stops" describes free daytime filler, so an 11 AM
  // dayclub set must not become the day's headline anchor.
  expect(isGoodAnchorEvent(poolParty, input)).toBe(false);

  // An explicit daytime-event intent still unlocks daytime anchors.
  expect(isGoodAnchorEvent(poolParty, { ...input, vibe: "pool party energy" })).toBe(true);
});

test("age-restricted events never anchor a family trip", () => {
  const lateRevue = event({
    id: "late-revue",
    name: "Late Night Revue (21+ Event)",
    localDate: "2026-08-02",
    localTime: "20:00:00",
  });

  expect(isGoodAnchorEvent(lateRevue, { groupType: "family with teens" })).toBe(false);
  expect(isGoodAnchorEvent(lateRevue, { groupType: "friends trip" })).toBe(true);

  const structuredRestriction = event({
    id: "structured-restriction",
    name: "Comedy Cellar Las Vegas",
    subcategory: "Stand-up comedy",
    shortDescription: "A rotating lineup of stand-up comics.",
    ageRestriction: "18+",
    localDate: "2026-08-02",
    localTime: "20:00:00",
  });

  expect(isGoodAnchorEvent(structuredRestriction, { groupType: "family with teens" })).toBe(false);
  expect(isGoodAnchorEvent(structuredRestriction, { groupType: "friends trip" })).toBe(true);
});

test("consecutive days prefer anchors at venues the trip has not used", () => {
  const events = [
    event({
      id: "tribute-one",
      name: "1969 Live Concert: The King Returns",
      category: "concerts",
      venueName: "Westgate Las Vegas Resort & Casino",
      localDate: "2026-08-01",
      localTime: "20:00:00",
    }),
    event({
      id: "tribute-two",
      name: "The King Comes Home",
      category: "concerts",
      venueName: "Westgate Las Vegas Resort & Casino",
      localDate: "2026-08-02",
      localTime: "20:00:00",
    }),
    event({
      id: "different-venue",
      name: "Absinthe",
      venueName: "Caesars Palace",
      localDate: "2026-08-02",
      localTime: "20:00:00",
    }),
  ];

  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-03",
      groupType: "friends trip",
      vibe: "big Vegas spectacle",
      stayingNear: "not booked yet",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    rankedEvents: events,
  });

  const anchors = days.flatMap((day) => day.blocks).filter((block) => block.category === "event");
  expect(anchors.map((block) => block.location)).toEqual([
    "Westgate Las Vegas Resort & Casino",
    "Caesars Palace",
  ]);
});

test("venue variety does not replace a materially stronger event", () => {
  const events = [
    event({
      id: "first-night",
      name: "First Night Headliner",
      venueName: "Bellagio",
      localDate: "2026-08-01",
      localTime: "20:00:00",
    }),
    event({
      id: "strong-repeat",
      name: "Second Night Spectacle",
      venueName: "Bellagio",
      localDate: "2026-08-02",
      localTime: "20:00:00",
      editorialScore: 100,
      valueScore: 100,
      wowScore: 100,
    }),
    event({
      id: "weak-fresh-venue",
      name: "Minor Fresh Venue Event",
      venueName: "Off Strip Theater",
      localDate: "2026-08-02",
      localTime: "20:00:00",
      editorialScore: 10,
      valueScore: 10,
      wowScore: 10,
    }),
  ];

  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-03",
      groupType: "friends trip",
      vibe: "big Vegas spectacle",
      stayingNear: "not booked yet",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    rankedEvents: events,
  });

  const anchors = days.flatMap((day) => day.blocks).filter((block) => block.category === "event");
  expect(anchors.map((block) => block.location)).toEqual(["Bellagio", "Bellagio"]);
});
