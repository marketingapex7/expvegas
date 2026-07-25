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
  /**
   * Upper bound on events returned across all pages. This is a ceiling, not a
   * page size: the search always sweeps the whole date window so that evening
   * inventory is reachable. Callers filter and slice afterwards.
   */
  maxResults?: number;
};

// Discovery API caps page size at 199 and refuses deep paging past 1000 items.
const TICKETMASTER_PAGE_SIZE = 199;
const TICKETMASTER_MAX_RESULTS = 995;

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

function classificationToCategory(classification?: TicketmasterClassification): EventCategory {
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
  const category = classificationToCategory(classification);
  const priceRange = event.priceRanges?.[0];
  const subcategory = usableTaxonomy(classification?.genre?.name) || usableTaxonomy(classification?.subGenre?.name) || usableTaxonomy(classification?.segment?.name);
  const displayName = cleanDisplayText(event.name) || "Las Vegas event";
  const displayVenue = cleanDisplayText(venue?.name) || "Las Vegas venue";
  const displayCategory = category === "concerts" ? "Concert" : category === "sports" ? "Live sports" : category === "comedy" ? "Comedy" : category === "shows" ? "Live show" : "Live experience";
  const editorialDescription = `${displayCategory} at ${displayVenue}. Confirm the listed performance time and current ticket price before booking.`;

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
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing TICKETMASTER_API_KEY");
  }

  const maxResults = Math.min(input.maxResults || TICKETMASTER_MAX_RESULTS, TICKETMASTER_MAX_RESULTS);
  const classificationName = categoryToClassification(input.category);

  function pageParams(page: number) {
    const params = new URLSearchParams({
      apikey: apiKey!,
      city: "Las Vegas",
      stateCode: "NV",
      countryCode: "US",
      sort: "date,asc",
      size: String(TICKETMASTER_PAGE_SIZE),
      page: String(page),
    });

    if (classificationName) params.set("classificationName", classificationName);
    if (input.startDate || input.endDate) {
      const startDate = input.startDate || input.endDate;
      const endDate = input.endDate || input.startDate;
      params.set("localStartDateTime", `${startDate}T00:00:00,${endDate}T23:59:59`);
    }

    return params;
  }

  const collected: TicketmasterEvent[] = [];
  const seenIds = new Set<string>();
  let page = 0;
  let totalPages = 1;

  // A single page sorted by date ascending only reaches the earliest events in
  // the window, which starves evening inventory. Sweep the window instead.
  while (page < totalPages && collected.length < maxResults) {
    const response = await fetch(`${TICKETMASTER_BASE_URL}/events.json?${pageParams(page).toString()}`, {
      next: { revalidate: 60 * 30 },
    });

    if (!response.ok) {
      // A failed follow-up page should not discard inventory already gathered.
      if (page > 0) break;
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

    totalPages = Math.min(
      data.page?.totalPages ?? 1,
      Math.ceil(TICKETMASTER_MAX_RESULTS / TICKETMASTER_PAGE_SIZE),
    );
    page += 1;
  }

  return collected.slice(0, maxResults).map(normalizeTicketmasterEvent);
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
