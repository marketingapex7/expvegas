import { hotels } from "@/data/hotels";
import { attractionStops, freeExperienceStops } from "@/data/planning-stops";
import { restaurants } from "@/data/restaurants";
import { DirectoryCategory, DirectoryListing, EnvironmentType, VegasZone } from "@/types/directory";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function priceLabel(level: "value" | "mid" | "premium") {
  if (level === "value") return "$";
  if (level === "mid") return "$$";
  return "$$$";
}

const directoryImages = {
  hotel: [
    "https://images.unsplash.com/photo-1720998606608-a294c85f24e1?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=82",
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=82",
  ],
  experience: [
    "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1610921926157-c17bba561357?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=82",
  ],
} as const;

function imageFor(category: keyof typeof directoryImages, index: number) {
  const images = directoryImages[category];
  return images[index % images.length];
}

function zoneFor(area: string, tags: string[]): VegasZone {
  const text = `${area} ${tags.join(" ")}`.toLowerCase();
  if (text.includes("downtown") || text.includes("fremont") || text.includes("arts district")) return "Downtown";
  if (text.includes("off strip") || text.includes("west of strip") || text.includes("east of strip") || text.includes("area15")) return "Off Strip";
  if (text.includes("south strip") || text.includes("south-center") || text.includes("park mgm") || text.includes("aria") || text.includes("t-mobile") || text.includes("allegiant")) return "South Strip";
  if (text.includes("north strip") || text.includes("north-center") || text.includes("wynn") || text.includes("venetian") || text.includes("sphere")) return "North Strip";
  return "Center Strip";
}

function environmentFor(category: DirectoryCategory, name: string, tags: string[]): EnvironmentType {
  const text = `${name} ${tags.join(" ")}`.toLowerCase();
  if (category === "hotel") return "Mixed";
  if (text.includes("promenade") || text.includes("fountain") || text.includes("fremont") || text.includes("stroll")) return "Outdoor";
  if (text.includes("walk") || text.includes("canal") || text.includes("shopping")) return "Mixed";
  return "Indoor";
}

function durationFor(category: DirectoryCategory, name: string) {
  const text = name.toLowerCase();
  if (category === "hotel") return { durationMinMinutes: 0, durationMaxMinutes: 0 };
  if (category === "restaurant") return { durationMinMinutes: 60, durationMaxMinutes: 120 };
  if (text.includes("high roller")) return { durationMinMinutes: 45, durationMaxMinutes: 75 };
  if (text.includes("area15")) return { durationMinMinutes: 120, durationMaxMinutes: 240 };
  if (category === "shopping") return { durationMinMinutes: 45, durationMaxMinutes: 150 };
  if (category === "free") return { durationMinMinutes: 30, durationMaxMinutes: 90 };
  return { durationMinMinutes: 60, durationMaxMinutes: 120 };
}

function idealTimeFor(category: DirectoryCategory, tags: string[]) {
  const text = tags.join(" ").toLowerCase();
  if (category === "hotel") return "Your full stay";
  if (text.includes("breakfast") || text.includes("brunch")) return "Morning or brunch";
  if (category === "restaurant") return text.includes("late night") ? "Dinner or late night" : "Lunch or dinner";
  if (text.includes("photo") || text.includes("views") || text.includes("fountain")) return "Late afternoon or evening";
  if (text.includes("late night") || text.includes("wild")) return "Evening or late night";
  return "Flexible daytime";
}

function bookingAdviceFor(category: DirectoryCategory, guidance: DirectoryListing["bookingGuidance"]) {
  if (category === "hotel") return "Compare the total stay price, resort fees, room type, and cancellation terms before booking.";
  if (guidance === "reserve") return "Reserve a time that leaves at least 90 minutes before a fixed show or event.";
  if (guidance === "free") return "No ticket is normally needed. Check current hours or temporary closures before leaving.";
  if (guidance === "flexible") return "Keep this movable and use it when the surrounding schedule has room.";
  return "Confirm the current schedule, final price, and entry requirements with the provider.";
}

function planningRoleFor(category: DirectoryCategory) {
  if (category === "hotel") return "Trip base";
  if (category === "restaurant") return "Timed meal";
  if (category === "free" || category === "shopping") return "Flexible filler";
  return "Day or night anchor";
}

function skipIfFor(category: DirectoryCategory, zone: VegasZone, environment: EnvironmentType, price: "value" | "mid" | "premium") {
  const reasons: string[] = [];
  if (price === "premium") reasons.push("The group is protecting a tight budget");
  if (environment === "Outdoor") reasons.push("The weather makes an outdoor stop uncomfortable");
  if (zone === "Off Strip" || zone === "Downtown") reasons.push("The rest of the day is tightly anchored on the Strip");
  if (category === "shopping") reasons.push("The group does not want browsing or retail time");
  if (category === "hotel") reasons.push("Most must-do plans are concentrated in another part of Vegas");
  if (category === "restaurant") reasons.push("The meal would create a rushed transfer to a fixed event");
  return reasons.length ? reasons.slice(0, 3) : ["The location or timing would add unnecessary backtracking"];
}

function planningTip(category: DirectoryListing["category"], area: string) {
  if (category === "hotel") return `Use ${area} as the trip anchor, then group each day around nearby plans before adding cross-town stops.`;
  if (category === "restaurant") return `Reserve around your fixed event time and allow extra travel time if the rest of the night is outside ${area}.`;
  if (category === "shopping" || category === "free") return "Keep this as a flexible stop that can expand, shrink, or move when the day changes.";
  return "Confirm current hours and place this between fixed reservations with a realistic arrival buffer.";
}

function costEstimate(category: DirectoryListing["category"], level: "value" | "mid" | "premium") {
  if (category === "free" || category === "shopping") return { estimatedCostMin: 0, estimatedCostMax: 0, costUnit: "free" as const };
  if (category === "hotel") {
    if (level === "value") return { estimatedCostMin: 90, estimatedCostMax: 170, costUnit: "per-night" as const };
    if (level === "mid") return { estimatedCostMin: 170, estimatedCostMax: 320, costUnit: "per-night" as const };
    return { estimatedCostMin: 320, estimatedCostMax: 650, costUnit: "per-night" as const };
  }
  if (category === "restaurant") {
    if (level === "value") return { estimatedCostMin: 15, estimatedCostMax: 35, costUnit: "per-person" as const };
    if (level === "mid") return { estimatedCostMin: 40, estimatedCostMax: 85, costUnit: "per-person" as const };
    return { estimatedCostMin: 90, estimatedCostMax: 180, costUnit: "per-person" as const };
  }
  if (level === "value") return { estimatedCostMin: 0, estimatedCostMax: 35, costUnit: "per-person" as const };
  if (level === "mid") return { estimatedCostMin: 35, estimatedCostMax: 100, costUnit: "per-person" as const };
  return { estimatedCostMin: 100, estimatedCostMax: 250, costUnit: "per-person" as const };
}

function mapUrl(name: string, area: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${area}, Las Vegas, NV`)}`;
}

export const hotelListings: DirectoryListing[] = hotels.map((hotel, index) => {
  const zone = zoneFor(hotel.area, hotel.tags);
  const environment = environmentFor("hotel", hotel.name, hotel.tags);
  const bookingGuidance = "check-availability" as const;
  return {
    id: `hotel-${hotel.slug}`,
    slug: hotel.slug,
    name: hotel.name,
    category: "hotel",
    area: hotel.area,
    description: hotel.description,
    imageUrl: imageFor("hotel", index),
    imageAlt: `${hotel.name} Las Vegas travel inspiration`,
    priceLabel: priceLabel(hotel.priceLevel),
    bestFor: hotel.bestFor,
    tags: hotel.tags,
    bookingUrl: hotel.bookingUrl,
    bookingLabel: "Check Hotel",
    durationLabel: "Trip base",
    planningTip: planningTip("hotel", hotel.area),
    highlights: hotel.tags.slice(0, 4),
    ...costEstimate("hotel", hotel.priceLevel),
    ...durationFor("hotel", hotel.name),
    bookingGuidance,
    bookingAdvice: bookingAdviceFor("hotel", bookingGuidance),
    planningRole: planningRoleFor("hotel"),
    zone,
    environment,
    idealTime: idealTimeFor("hotel", hotel.tags),
    skipIf: skipIfFor("hotel", zone, environment, hotel.priceLevel),
    lastVerified: "July 2026",
    mapUrl: mapUrl(hotel.name, hotel.area),
    editorialScore: hotel.editorialScore,
  };
});

export const restaurantListings: DirectoryListing[] = restaurants.map((restaurant, index) => {
  const tags = [...restaurant.cuisine, ...restaurant.categories, ...restaurant.vibeTags, ...restaurant.mealTypes];
  const zone = zoneFor(restaurant.area, tags);
  const environment = environmentFor("restaurant", restaurant.name, tags);
  const bookingGuidance = restaurant.reservationUrl ? "reserve" as const : "flexible" as const;
  return {
    id: `restaurant-${restaurant.slug}`,
    slug: restaurant.slug,
    name: restaurant.name,
    category: "restaurant",
    area: restaurant.area,
    venue: restaurant.venue,
    description: restaurant.description,
    imageUrl: imageFor("restaurant", index),
    imageAlt: `${restaurant.name} dining inspiration`,
    priceLabel: priceLabel(restaurant.priceLevel),
    bestFor: restaurant.bestFor,
    tags,
    bookingUrl: restaurant.reservationUrl,
    bookingLabel: restaurant.reservationUrl ? "Reserve Table" : "Find Nearby",
    durationLabel: "Allow 60-120 min",
    planningTip: planningTip("restaurant", restaurant.area),
    highlights: [...restaurant.cuisine, ...restaurant.mealTypes, ...restaurant.vibeTags].slice(0, 4),
    ...costEstimate("restaurant", restaurant.priceLevel),
    ...durationFor("restaurant", restaurant.name),
    bookingGuidance,
    bookingAdvice: bookingAdviceFor("restaurant", bookingGuidance),
    planningRole: planningRoleFor("restaurant"),
    zone,
    environment,
    idealTime: idealTimeFor("restaurant", tags),
    skipIf: skipIfFor("restaurant", zone, environment, restaurant.priceLevel),
    lastVerified: "July 2026",
    mapUrl: mapUrl(restaurant.name, restaurant.area),
    editorialScore: restaurant.editorialScore,
  };
});

const experienceSource = [...freeExperienceStops, ...attractionStops];

export const experienceListings: DirectoryListing[] = experienceSource
  .filter((stop, index, items) => items.findIndex((item) => item.name === stop.name) === index)
  .map((stop, index) => {
    const category = stop.tags.includes("shopping") ? "shopping" : stop.tags.includes("free") ? "free" : "attraction";
    const zone = zoneFor(stop.area, stop.tags);
    const environment = environmentFor(category, stop.name, stop.tags);
    const bookingGuidance = category === "free" || category === "shopping" ? "free" as const : "check-availability" as const;
    return {
      id: `experience-${slugify(stop.name)}`,
      slug: slugify(stop.name),
      name: stop.name,
      category,
      area: stop.area,
      description: stop.description,
      imageUrl: imageFor("experience", index),
      imageAlt: `${stop.name} Las Vegas travel inspiration`,
      priceLabel: category === "free" || category === "shopping" ? "Free to explore" : priceLabel(stop.budget),
      bestFor: stop.tags.filter((tag) => !["free", "mid", "premium", "value"].includes(tag)).slice(0, 4),
      tags: stop.tags,
      bookingLabel: "View Details",
      durationLabel: category === "free" || category === "shopping" ? "Flexible timing" : "Allow 60-120 min",
      planningTip: planningTip(category, stop.area),
      highlights: stop.tags.filter((tag) => !["mid", "premium", "value"].includes(tag)).slice(0, 4),
      ...costEstimate(category, stop.budget),
      ...durationFor(category, stop.name),
      bookingGuidance,
      bookingAdvice: bookingAdviceFor(category, bookingGuidance),
      planningRole: planningRoleFor(category),
      zone,
      environment,
      idealTime: idealTimeFor(category, stop.tags),
      skipIf: skipIfFor(category, zone, environment, stop.budget),
      lastVerified: "July 2026",
      mapUrl: mapUrl(stop.name, stop.area),
      editorialScore: category === "free" ? 88 : 84,
    } satisfies DirectoryListing;
  });

export const directoryListings = [...hotelListings, ...restaurantListings, ...experienceListings];

export function getDirectoryListingBySlug(slug: string) {
  return directoryListings.find((listing) => listing.slug === slug);
}
