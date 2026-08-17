import { expect, test } from "@playwright/test";
import { filterTonightEvents, HomepageEventShelf, reusableShelf } from "../lib/live-events";
import { VegasEvent } from "../types/event";

function event(id: string, name: string, localTime: string): VegasEvent {
  return {
    id,
    name,
    slug: id,
    category: "concerts",
    venueName: "Encore Beach Club",
    area: "North Strip",
    localDate: "2026-07-24",
    localTime,
    tags: ["music"],
    bestFor: ["Music fans"],
    skipIf: [],
    shortDescription: "Concert at Encore Beach Club.",
    quickVerdict: "Concert at Encore Beach Club. Confirm the listed performance time before booking.",
    affiliateUrl: `https://example.com/${id}`,
    editorialScore: 80,
    valueScore: 70,
    wowScore: 80,
    familyScore: 20,
    couplesScore: 70,
    bachelorScore: 80,
  };
}

test("tonight inventory excludes daytime and already-started events", () => {
  const events = [
    event("morning", "Morning Pool Event", "10:00:00"),
    event("afternoon", "Afternoon Event", "15:30:00"),
    event("evening", "Bob Moses", "20:00:00"),
    event("late", "Late Show", "23:00:00"),
  ];

  const tonight = filterTonightEvents(events, "2026-07-24", 18 * 60);
  expect(tonight.map((item) => item.name)).toEqual(["Bob Moses", "Late Show"]);
  expect(tonight.every((item) => Number(item.localTime?.slice(0, 2)) >= 18)).toBe(true);
});

function shelf(overrides: Partial<HomepageEventShelf> = {}): HomepageEventShelf {
  return {
    events: [
      event("one", "First Show", "20:00:00"),
      event("two", "Second Show", "21:00:00"),
      event("three", "Third Show", "22:00:00"),
    ],
    isLive: true,
    startDate: "2026-07-24",
    endDate: "2026-07-24",
    tier: "tonight",
    eyebrow: "Live tonight",
    title: "Events that still fit tonight.",
    description: "Future start times only.",
    updatedLabel: "Updated 5:00 PM PDT",
    ...overrides,
  };
}

test("a cached shelf is never re-served on a later day", () => {
  const cached = { shelf: shelf(), builtForDate: "2026-07-24" };
  expect(reusableShelf(cached, "2026-07-25", 16 * 60)).toBeNull();
  expect(reusableShelf(cached, "2026-07-24", 16 * 60)).not.toBeNull();
});

test("a re-served tonight shelf drops showtimes that have since passed", () => {
  const cached = { shelf: shelf(), builtForDate: "2026-07-24" };

  // 9:30 PM: only the 10 PM show is still ahead, which is under the three-event
  // floor, so the stale shelf is refused rather than shown as "still fits".
  expect(reusableShelf(cached, "2026-07-24", 21 * 60 + 30)).toBeNull();

  const stillUseful = reusableShelf(cached, "2026-07-24", 19 * 60);
  expect(stillUseful?.events.map((item) => item.name)).toEqual(["First Show", "Second Show", "Third Show"]);
});

test("a cached weekend shelf stays valid until its window has passed", () => {
  const cached = {
    shelf: shelf({ tier: "weekend", eyebrow: "This weekend", startDate: "2026-07-24", endDate: "2026-07-26" }),
    builtForDate: "2026-07-22",
  };

  expect(reusableShelf(cached, "2026-07-26", 16 * 60)).not.toBeNull();
  expect(reusableShelf(cached, "2026-07-27", 16 * 60)).toBeNull();
});

test("tonight inventory keeps only eligible showtimes on a multi-show event", () => {
  const multi = {
    ...event("multi", "Multiple Showtime Event", "10:00:00"),
    showtimes: [
      { id: "morning", localDate: "2026-07-24", localTime: "10:00:00", affiliateUrl: "https://example.com/morning" },
      { id: "night", localDate: "2026-07-24", localTime: "21:00:00", affiliateUrl: "https://example.com/night" },
    ],
  };

  const [tonight] = filterTonightEvents([multi], "2026-07-24", 16 * 60);
  expect(tonight.localTime).toBe("21:00:00");
  expect(tonight.showtimes).toHaveLength(1);
  expect(tonight.affiliateUrl).toBe("https://example.com/night");
});
