import { hotels } from "@/data/hotels";
import { attractionStops, freeExperienceStops } from "@/data/planning-stops";
import { restaurants } from "@/data/restaurants";
import { DirectoryListing } from "@/types/directory";

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
    "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?auto=format&fit=crop&w=1200&q=82",
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
    "https://images.unsplash.com/photo-1577334928618-2ff4d02d28e8?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1575089776834-8be34696ff63?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=82",
  ],
} as const;

function imageFor(category: keyof typeof directoryImages, index: number) {
  const images = directoryImages[category];
  return images[index % images.length];
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

export const hotelListings: DirectoryListing[] = hotels.map((hotel, index) => ({
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
  bookingGuidance: "check-availability",
  lastVerified: "July 2026",
  mapUrl: mapUrl(hotel.name, hotel.area),
  editorialScore: hotel.editorialScore,
}));

export const restaurantListings: DirectoryListing[] = restaurants.map((restaurant, index) => ({
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
  tags: [...restaurant.cuisine, ...restaurant.categories, ...restaurant.vibeTags],
  bookingUrl: restaurant.reservationUrl,
  bookingLabel: restaurant.reservationUrl ? "Reserve Table" : "Find Nearby",
  durationLabel: "Allow 60-120 min",
  planningTip: planningTip("restaurant", restaurant.area),
  highlights: [...restaurant.cuisine, ...restaurant.mealTypes, ...restaurant.vibeTags].slice(0, 4),
  ...costEstimate("restaurant", restaurant.priceLevel),
  bookingGuidance: restaurant.reservationUrl ? "reserve" : "flexible",
  lastVerified: "July 2026",
  mapUrl: mapUrl(restaurant.name, restaurant.area),
  editorialScore: restaurant.editorialScore,
}));

const experienceSource = [...freeExperienceStops, ...attractionStops];

export const experienceListings: DirectoryListing[] = experienceSource
  .filter((stop, index, items) => items.findIndex((item) => item.name === stop.name) === index)
  .map((stop, index) => {
    const category = stop.tags.includes("shopping") ? "shopping" : stop.tags.includes("free") ? "free" : "attraction";
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
      bookingGuidance: category === "free" || category === "shopping" ? "free" : "check-availability",
      lastVerified: "July 2026",
      mapUrl: mapUrl(stop.name, stop.area),
      editorialScore: category === "free" ? 88 : 84,
    } satisfies DirectoryListing;
  });

export const directoryListings = [...hotelListings, ...restaurantListings, ...experienceListings];

export function getDirectoryListingBySlug(slug: string) {
  return directoryListings.find((listing) => listing.slug === slug);
}
