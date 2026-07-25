import { expect, test } from "@playwright/test";
import { buildItinerary, sanitizeSchedule } from "../lib/itinerary-engine";
import { generatePlannerResponse } from "../lib/planner-service";
import { VegasEvent } from "../types/event";

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
