import { VegasEvent } from "@/types/event";

const KNOWN_EVENT_ALIASES: Array<{ key: string; pattern: RegExp }> = [
  { key: "absinthe", pattern: /\babsinthe\b/i },
  { key: "comedy-cellar-las-vegas", pattern: /\bcomedy cellar\b/i },
  { key: "high-roller-observation-wheel", pattern: /\bhigh roller(?: observation wheel)?\b/i },
  { key: "o-cirque-du-soleil", pattern: /^(?:["']?o["']?)(?:\s+by\s+cirque du soleil)?$/i },
];

function normalizeIdentityText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\((?:18|21)\+\s*(?:event)?\)/g, " ")
    .replace(/\(las vegas\)/g, " ")
    .replace(/\s+by\s+cirque du soleil\b/g, " ")
    .replace(/\blas vegas\b$/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalEventTitle(name: string) {
  const normalized = normalizeIdentityText(name);
  const alias = KNOWN_EVENT_ALIASES.find((entry) => entry.pattern.test(normalized));
  return alias?.key || normalized;
}

export function canonicalEventKey(event: Pick<VegasEvent, "name" | "venueName" | "seriesId">) {
  const title = canonicalEventTitle(event.name);
  const alias = KNOWN_EVENT_ALIASES.find((entry) => entry.key === title);
  if (alias) return `known:${alias.key}`;
  if (event.seriesId) return `series:${event.seriesId}`;
  return `title:${title}|venue:${normalizeIdentityText(event.venueName)}`;
}

function eventShowtimes(event: VegasEvent) {
  if (event.showtimes?.length) return event.showtimes;
  if (!event.localDate && !event.localTime) return [];
  return [{
    id: event.id,
    localDate: event.localDate,
    localTime: event.localTime,
    startDateTime: event.startDateTime,
    affiliateUrl: event.affiliateUrl,
  }];
}

function mergedShowtimes(events: VegasEvent[]) {
  const byPerformance = new Map<string, NonNullable<VegasEvent["showtimes"]>[number]>();

  for (const showtime of events.flatMap(eventShowtimes)) {
    const key = `${showtime.localDate || ""}|${showtime.localTime || ""}|${showtime.startDateTime || ""}`;
    const existing = byPerformance.get(key);
    if (!existing || (!existing.affiliateUrl && showtime.affiliateUrl)) byPerformance.set(key, showtime);
  }

  return [...byPerformance.values()].sort((a, b) =>
    `${a.localDate || ""}T${a.localTime || ""}`.localeCompare(`${b.localDate || ""}T${b.localTime || ""}`),
  );
}

export function collapseEventShowtimes(events: VegasEvent[]) {
  const groups = new Map<string, VegasEvent[]>();

  for (const event of events) {
    const key = canonicalEventKey(event);
    groups.set(key, [...(groups.get(key) || []), event]);
  }

  return [...groups.values()].map((group) => {
    const live = group.find((event) => event.id.startsWith("ticketmaster-"));
    const representative = live || group[0];
    const fallback = group.find((event) => event !== representative);
    const showtimes = mergedShowtimes(group);
    const first = showtimes[0];

    return {
      ...representative,
      seriesId: representative.seriesId || fallback?.seriesId,
      imageUrl: representative.imageUrl || fallback?.imageUrl,
      runtimeMinutes: representative.runtimeMinutes || fallback?.runtimeMinutes,
      ageRestriction: representative.ageRestriction || fallback?.ageRestriction,
      priceMin: representative.priceMin ?? fallback?.priceMin,
      priceMax: representative.priceMax ?? fallback?.priceMax,
      localDate: first?.localDate || representative.localDate,
      localTime: first?.localTime || representative.localTime,
      startDateTime: first?.startDateTime || representative.startDateTime,
      affiliateUrl: first?.affiliateUrl || representative.affiliateUrl,
      showtimes: showtimes.length ? showtimes : undefined,
    };
  });
}
