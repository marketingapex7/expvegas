import { EventCategory, VegasEvent } from "@/types/event";

const TICKETMASTER_BASE_URL = process.env.TICKETMASTER_BASE_URL || "https://app.ticketmaster.com/discovery/v2";

type TicketmasterImage = {
  url?: string;
  width?: number;
  height?: number;
  ratio?: string;
};

type TicketmasterPriceRange = {
  min?: number;
  max?: number;
  currency?: string;
};

type TicketmasterClassification = {
  segment?: { name?: string };
  genre?: { name?: string };
  subGenre?: { name?: string };
};

type TicketmasterVenue = {
  name?: string;
  city?: { name?: string };
  state?: { stateCode?: string; name?: string };
  address?: { line1?: string };
  postalCode?: string;
  country?: { countryCode?: string; name?: string };
};

type TicketmasterEvent = {
  id: string;
  name: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  images?: TicketmasterImage[];
  priceRanges?: TicketmasterPriceRange[];
  classifications?: TicketmasterClassification[];
  _embedded?: {
    venues?: TicketmasterVenue[];
  };
};

type TicketmasterResponse = {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size?: number;
    totalElements?: number;
    totalPages?: number;
    number?: number;
  };
};

type TicketmasterSearchInput = {
  startDate?: string;
  endDate?: string;
  category?: EventCategory;
};

// Discovery API caps page size at 199 and refuses deep paging past 1000 items.
const TICKETMASTER_PAGE_SIZE = 199;
const TICKETMASTER_MAX_PAGES = 5;
const MAX_SEARCH_DAYS = 7;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryToClassification(category?: EventCategory) {
  if (category === "concerts") return "music";
  if (category === "sports") return "sports";
  if (category === "comedy") return "comedy";
  if (category === "shows") return "theatre";
  return undefined;
}

// Ticketmaster files several long-running Vegas residencies under Music or
// Miscellaneous, which surfaces a dance show like Jabbawockeez as "Concert".
const RESIDENCY_CATEGORY_OVERRIDES: Array<{ pattern: RegExp; category: EventCategory }> = [
  { pattern: /\b(jabbawockeez|blue man group|absinthe|atomic saloon|magic mike|thunder from down under|chippendales)\b/i, category: "shows" },
  { pattern: /\b(cirque du soleil|myst[eè]re|michael jackson one|the beatles love|mad apple)\b/i, category: "shows" },
  { pattern: /\b(o by cirque|ka by cirque)\b/i, category: "shows" },
  { pattern: /\b(carrot top|piff the magic dragon|penn (and|&) teller|comedy cellar|brad garrett)\b/i, category: "comedy" },
];

function classificationToCategory(classification?: TicketmasterClassification, eventName?: string): EventCategory {
  const override = RESIDENCY_CATEGORY_OVERRIDES.find((entry) => entry.pattern.test(eventName || ""));
  if (override) return override.category;

  const segment = classification?.segment?.name?.toLowerCase() || "";
  const genre = classification?.genre?.name?.toLowerCase() || "";

  if (segment.includes("sports")) return "sports";
  if (segment.includes("music")) return "concerts";
  if (genre.includes("comedy")) return "comedy";
  if (segment.includes("arts") || segment.includes("theatre") || genre.includes("theatre")) return "shows";
  return "attractions";
}

function usableTaxonomy(value?: string) {
  const normalized = value?.trim();
  if (!normalized || normalized.toLowerCase() === "undefined" || normalized.toLowerCase() === "unknown") return undefined;
  return normalized;
}

function bestImage(images?: TicketmasterImage[]) {
  return images
    ?.filter((image) => image.url)
    .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0))[0]?.url;
}

function cleanDisplayText(value?: string) {
  return (value || "")
    .replace(/[^\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTicketmasterEvent(event: TicketmasterEvent): VegasEvent {
  const classification = event.classifications?.[0];
  const venue = event._embedded?.venues?.[0];
  const displayName = cleanDisplayText(event.name) || "Las Vegas event";
  const category = classificationToCategory(classification, displayName);
  const priceRange = event.priceRanges?.[0];
  const subcategory = usableTaxonomy(classification?.genre?.name) || usableTaxonomy(classification?.subGenre?.name) || usableTaxonomy(classification?.segment?.name);
  const displayVenue = cleanDisplayText(venue?.name) || "Las Vegas venue";
  const displayCategory = category === "concerts" ? "Concert" : category === "sports" ? "Live sports" : category === "comedy" ? "Comedy" : category === "shows" ? "Live show" : "Live experience";
  // The "confirm times and prices" caveat belongs in one place on the card, not
  // repeated inside every description.
  const editorialDescription = `${displayCategory} at ${displayVenue}.`;

  return {
    id: `ticketmaster-${event.id}`,
    name: displayName,
    slug: slugify(displayName),
    category,
    subcategory,
    venueName: displayVenue,
    area: venue?.city?.name === "Las Vegas" ? "Las Vegas" : venue?.city?.name || "Las Vegas",
    priceMin: priceRange?.min,
    priceMax: priceRange?.max,
    startDateTime: event.dates?.start?.dateTime,
    localDate: event.dates?.start?.localDate,
    localTime: event.dates?.start?.localTime,
    currency: priceRange?.currency || "USD",
    venueAddress: {
      streetAddress: venue?.address?.line1,
      addressLocality: venue?.city?.name,
      addressRegion: venue?.state?.stateCode || venue?.state?.name,
      postalCode: venue?.postalCode,
      addressCountry: venue?.country?.countryCode || venue?.country?.name || "US",
    },
    tags: [category, subcategory, venue?.name].filter(Boolean).map((tag) => String(tag).toLowerCase()),
    bestFor: category === "sports" ? ["Sports fans", "Arena nights"] : category === "concerts" ? ["Music fans", "A headline night out"] : category === "comedy" ? ["Adults who want an easy night", "Lower-key groups"] : ["Date-specific plans", "First-time visitors"],
    skipIf: ["You only want curated editorial picks"],
    shortDescription: editorialDescription,
    quickVerdict: editorialDescription,
    affiliateUrl: event.url || "#",
    imageUrl: bestImage(event.images),
    editorialScore: 78,
    valueScore: priceRange?.min && priceRange.min <= 100 ? 82 : 68,
    wowScore: category === "concerts" || category === "sports" ? 82 : 74,
    familyScore: 55,
    couplesScore: 70,
    bachelorScore: category === "sports" || category === "concerts" ? 82 : 68,
  };
}

export async function searchTicketmasterEvents(input: TicketmasterSearchInput = {}) {
  const configuredKey = process.env.TICKETMASTER_API_KEY;
  if (!configuredKey) {
    throw new Error("Missing TICKETMASTER_API_KEY");
  }

  const apiKey: string = configuredKey;
  // Several resident Vegas shows are filed under Music or Miscellaneous.
  // Fetch the broader inventory for shows, then apply our normalized taxonomy.
  const classificationName = input.category === "shows" ? undefined : categoryToClassification(input.category);

  function searchWindows() {
    const startValue = input.startDate || input.endDate;
    const endValue = input.endDate || input.startDate;
    if (!startValue || !endValue) return [{ startDate: undefined, endDate: undefined }];

    const start = new Date(`${startValue}T00:00:00Z`);
    const end = new Date(`${endValue}T00:00:00Z`);
    const windows: Array<{ startDate: string; endDate: string }> = [];

    for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      if (windows.length >= MAX_SEARCH_DAYS) {
        throw new Error(`Ticketmaster search range cannot exceed ${MAX_SEARCH_DAYS} calendar days`);
      }
      const date = cursor.toISOString().slice(0, 10);
      windows.push({ startDate: date, endDate: date });
    }

    return windows;
  }

  function pageParams(page: number, window: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams({
      apikey: apiKey,
      city: "Las Vegas",
      stateCode: "NV",
      countryCode: "US",
      sort: "date,asc",
      size: String(TICKETMASTER_PAGE_SIZE),
      page: String(page),
    });

    if (classificationName) params.set("classificationName", classificationName);
    if (window.startDate && window.endDate) {
      params.set("localStartDateTime", `${window.startDate}T00:00:00,${window.endDate}T23:59:59`);
    }

    return params;
  }

  const collected: TicketmasterEvent[] = [];
  const seenIds = new Set<string>();

  // Partition multi-day searches so a dense first day cannot consume
  // Ticketmaster's 1,000-result deep-paging ceiling for the entire trip.
  for (const window of searchWindows()) {
    let page = 0;
    let totalPages = 1;

    while (page < totalPages && page < TICKETMASTER_MAX_PAGES) {
      const response = await fetch(`${TICKETMASTER_BASE_URL}/events.json?${pageParams(page, window).toString()}`, {
        next: { revalidate: 60 * 30 },
      });

      if (!response.ok) {
        // A failed follow-up page should not discard inventory already gathered.
        if (page > 0 || collected.length > 0) break;
        throw new Error(`Ticketmaster request failed with ${response.status}`);
      }

      const data = (await response.json()) as TicketmasterResponse;
      const events = data._embedded?.events || [];

      for (const event of events) {
        if (seenIds.has(event.id)) continue;
        seenIds.add(event.id);
        collected.push(event);
      }

      if (events.length === 0) break;

      totalPages = Math.min(data.page?.totalPages ?? 1, TICKETMASTER_MAX_PAGES);
      page += 1;
    }
  }

  const normalized = collected.map(normalizeTicketmasterEvent);
  return input.category
    ? normalized.filter((event) => event.category === input.category)
    : normalized;
}

export async function getTicketmasterEvent(eventId: string) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing TICKETMASTER_API_KEY");
  }

  const response = await fetch(
    `${TICKETMASTER_BASE_URL}/events/${encodeURIComponent(eventId)}.json?apikey=${encodeURIComponent(apiKey)}`,
    { next: { revalidate: 60 * 30 } },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Ticketmaster event request failed with ${response.status}`);
  }

  return normalizeTicketmasterEvent((await response.json()) as TicketmasterEvent);
}
