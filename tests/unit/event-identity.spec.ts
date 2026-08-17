import { expect, test } from "vitest";
import { canonicalEventKey, collapseEventShowtimes } from "@/lib/event-identity";
import { VegasEvent } from "@/types/event";

function event(overrides: Partial<VegasEvent>): VegasEvent {
  return {
    id: "event",
    name: "O by Cirque du Soleil",
    slug: "o-by-cirque-du-soleil",
    category: "shows",
    venueName: "Bellagio",
    area: "Center Strip",
    tags: ["show"],
    bestFor: ["First-timers"],
    skipIf: [],
    shortDescription: "A live Vegas show.",
    quickVerdict: "A live Vegas show.",
    affiliateUrl: "https://example.com/tickets",
    editorialScore: 90,
    valueScore: 80,
    wowScore: 95,
    familyScore: 80,
    couplesScore: 90,
    bachelorScore: 60,
    ...overrides,
  };
}

test("known production aliases share one canonical identity", () => {
  expect(canonicalEventKey(event({ name: "O" }))).toBe(
    canonicalEventKey(event({ name: "O by Cirque du Soleil", venueName: "O Theatre at Bellagio" })),
  );
});

test("provider performances collapse into one event with unique showtimes", () => {
  const events = collapseEventShowtimes([
    event({
      id: "ticketmaster-first",
      seriesId: "attraction-123",
      name: "Headline Show",
      localDate: "2026-08-01",
      localTime: "19:00:00",
    }),
    event({
      id: "ticketmaster-duplicate",
      seriesId: "attraction-123",
      name: "Headline Show (21+ Event)",
      localDate: "2026-08-01",
      localTime: "19:00:00",
    }),
    event({
      id: "ticketmaster-late",
      seriesId: "attraction-123",
      name: "Headline Show",
      localDate: "2026-08-01",
      localTime: "21:30:00",
    }),
  ]);

  expect(events).toHaveLength(1);
  expect(events[0].showtimes).toHaveLength(2);
  expect(events[0].showtimes?.map((showtime) => showtime.localTime)).toEqual(["19:00:00", "21:30:00"]);
});
