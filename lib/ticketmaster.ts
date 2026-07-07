import { EventCategory, VegasEvent } from "@/types/event";

const TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

type TicketmasterImage = {
  url?: string;
  width?: number;
  height?: number;
  ratio?: string;
};

type TicketmasterPriceRange = {
  min?: number;
  max?: number;
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
};

type TicketmasterEvent = {
  id: string;
  name: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
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
};

type TicketmasterSearchInput = {
  startDate?: string;
  endDate?: string;
  category?: EventCategory;
  size?: number;
};

function toTicketmasterDate(date: string, endOfDay = false) {
  return `${date}T${endOfDay ? "23:59:59" : "00:00:00"}Z`;
}

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

function bestImage(images?: TicketmasterImage[]) {
  return images
    ?.filter((image) => image.url)
    .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0))[0]?.url;
}

function normalizeTicketmasterEvent(event: TicketmasterEvent): VegasEvent {
  const classification = event.classifications?.[0];
  const venue = event._embedded?.venues?.[0];
  const category = classificationToCategory(classification);
  const priceRange = event.priceRanges?.[0];
  const subcategory = classification?.genre?.name || classification?.subGenre?.name || classification?.segment?.name;

  return {
    id: `ticketmaster-${event.id}`,
    name: event.name,
    slug: slugify(event.name),
    category,
    subcategory,
    venueName: venue?.name || "Las Vegas venue",
    area: venue?.city?.name === "Las Vegas" ? "Las Vegas" : venue?.city?.name || "Las Vegas",
    priceMin: priceRange?.min,
    priceMax: priceRange?.max,
    tags: [category, subcategory, venue?.name].filter(Boolean).map((tag) => String(tag).toLowerCase()),
    bestFor: ["Date-specific plans", "Visitors comparing live events"],
    skipIf: ["You only want curated editorial picks"],
    shortDescription: event.info || `${event.name} in Las Vegas.`,
    quickVerdict: `${event.name} is a live Vegas event from Ticketmaster${venue?.name ? ` at ${venue.name}` : ""}.`,
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

  const params = new URLSearchParams({
    apikey: apiKey,
    city: "Las Vegas",
    stateCode: "NV",
    countryCode: "US",
    sort: "date,asc",
    size: String(input.size || 20),
  });

  const classificationName = categoryToClassification(input.category);
  if (classificationName) params.set("classificationName", classificationName);
  if (input.startDate) params.set("startDateTime", toTicketmasterDate(input.startDate));
  if (input.endDate) params.set("endDateTime", toTicketmasterDate(input.endDate, true));

  const response = await fetch(`${TICKETMASTER_BASE_URL}?${params.toString()}`, {
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    throw new Error(`Ticketmaster request failed with ${response.status}`);
  }

  const data = (await response.json()) as TicketmasterResponse;
  return (data._embedded?.events || []).map(normalizeTicketmasterEvent);
}
