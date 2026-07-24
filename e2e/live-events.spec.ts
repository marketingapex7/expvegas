import { expect, test } from "@playwright/test";
import { filterTonightEvents } from "../lib/live-events";
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
