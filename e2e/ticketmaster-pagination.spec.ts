import { expect, test } from "@playwright/test";
import { searchTicketmasterEvents } from "../lib/ticketmaster";

function ticketmasterEvent(id: string, name: string, localDate: string, localTime: string) {
  return {
    id,
    name,
    dates: { start: { localDate, localTime } },
    classifications: [{ segment: { name: "Arts & Theatre" }, genre: { name: "Theatre" } }],
    _embedded: {
      venues: [{ name: "Test Theater", city: { name: "Las Vegas" }, state: { stateCode: "NV" } }],
    },
  };
}

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
