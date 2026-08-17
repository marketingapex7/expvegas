import { expect, test } from "vitest";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";

function ticketmasterEvent(
  id: string,
  name: string,
  localDate: string,
  localTime: string,
  segment = "Arts & Theatre",
  genre = "Theatre",
  attractionId?: string,
) {
  return {
    id,
    name,
    dates: { start: { localDate, localTime } },
    classifications: [{ segment: { name: segment }, genre: { name: genre } }],
    _embedded: {
      venues: [{ name: "Test Theater", city: { name: "Las Vegas" }, state: { stateCode: "NV" } }],
      attractions: attractionId ? [{ id: attractionId, name }] : undefined,
    },
  };
}

test("Ticketmaster performances for one attraction become a single event with showtimes", async () => {
  const configuredKey = process.env.TICKETMASTER_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.TICKETMASTER_API_KEY = "test-key";

  globalThis.fetch = (async () => new Response(JSON.stringify({
    _embedded: {
      events: [
        ticketmasterEvent("early", "Resident Headliner", "2026-08-01", "19:00:00", "Arts & Theatre", "Theatre", "resident-1"),
        ticketmasterEvent("late", "Resident Headliner (21+ Event)", "2026-08-01", "21:30:00", "Arts & Theatre", "Theatre", "resident-1"),
      ],
    },
    page: { totalPages: 1, number: 0 },
  }), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;

  try {
    const events = await searchTicketmasterEvents({ startDate: "2026-08-01", endDate: "2026-08-01" });
    expect(events).toHaveLength(1);
    expect(events[0].seriesId).toBe("resident-1");
    expect(events[0].showtimes).toHaveLength(2);
  } finally {
    globalThis.fetch = originalFetch;
    if (configuredKey) process.env.TICKETMASTER_API_KEY = configuredKey;
    else delete process.env.TICKETMASTER_API_KEY;
  }
});

test("Ticketmaster search scans later pages and partitions multi-day trips", async () => {
  const configuredKey = process.env.TICKETMASTER_API_KEY;
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  process.env.TICKETMASTER_API_KEY = "test-key";

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input.toString() : input.url);
    const range = url.searchParams.get("localStartDateTime") || "";
    const page = Number(url.searchParams.get("page") || "0");
    calls.push(`${range}|${page}`);

    const isFirstDay = range.startsWith("2026-08-01");
    const events = isFirstDay
      ? page === 0
        ? [ticketmasterEvent("day-one-morning", "Day One Morning", "2026-08-01", "10:00:00")]
        : [ticketmasterEvent("day-one-evening", "Day One Evening", "2026-08-01", "20:00:00")]
      : [ticketmasterEvent("day-two-evening", "Day Two Evening", "2026-08-02", "20:30:00")];

    return new Response(JSON.stringify({
      _embedded: { events },
      page: { totalPages: isFirstDay ? 2 : 1, number: page },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  try {
    const events = await searchTicketmasterEvents({ startDate: "2026-08-01", endDate: "2026-08-02" });

    expect(events.map((event) => event.name)).toEqual([
      "Day One Morning",
      "Day One Evening",
      "Day Two Evening",
    ]);
    expect(calls).toContain("2026-08-01T00:00:00,2026-08-01T23:59:59|1");
    expect(calls).toContain("2026-08-02T00:00:00,2026-08-02T23:59:59|0");
  } finally {
    globalThis.fetch = originalFetch;
    if (configuredKey) process.env.TICKETMASTER_API_KEY = configuredKey;
    else delete process.env.TICKETMASTER_API_KEY;
  }
});

test("show searches use normalized Vegas categories instead of Ticketmaster's upstream segment", async () => {
  const configuredKey = process.env.TICKETMASTER_API_KEY;
  const originalFetch = globalThis.fetch;
  let requestedClassification: string | null = "not-called";
  process.env.TICKETMASTER_API_KEY = "test-key";

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input.toString() : input.url);
    requestedClassification = url.searchParams.get("classificationName");

    return new Response(JSON.stringify({
      _embedded: {
        events: [
          ticketmasterEvent("jabbawockeez", "Jabbawockeez", "2026-08-01", "19:00:00", "Music", "Dance/Electronic"),
          ticketmasterEvent("concert", "Regular Concert", "2026-08-01", "20:00:00", "Music", "Rock"),
          ticketmasterEvent("piff", "Piff the Magic Dragon", "2026-08-01", "21:00:00", "Arts & Theatre", "Comedy"),
        ],
      },
      page: { totalPages: 1, number: 0 },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  try {
    const events = await searchTicketmasterEvents({
      startDate: "2026-08-01",
      endDate: "2026-08-01",
      category: "shows",
    });

    expect(requestedClassification).toBeNull();
    expect(events.map((event) => event.name)).toEqual(["Jabbawockeez"]);
    expect(events.every((event) => event.category === "shows")).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
    if (configuredKey) process.env.TICKETMASTER_API_KEY = configuredKey;
    else delete process.env.TICKETMASTER_API_KEY;
  }
});

test("Ticketmaster search rejects ranges longer than seven inclusive calendar days", async () => {
  const configuredKey = process.env.TICKETMASTER_API_KEY;
  process.env.TICKETMASTER_API_KEY = "test-key";

  try {
    await expect(searchTicketmasterEvents({
      startDate: "2026-08-01",
      endDate: "2026-08-08",
    })).rejects.toThrow("cannot exceed 7 calendar days");
  } finally {
    if (configuredKey) process.env.TICKETMASTER_API_KEY = configuredKey;
    else delete process.env.TICKETMASTER_API_KEY;
  }
});
