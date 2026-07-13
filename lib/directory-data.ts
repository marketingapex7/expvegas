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

export const hotelListings: DirectoryListing[] = hotels.map((hotel) => ({
  id: `hotel-${hotel.slug}`,
  slug: hotel.slug,
  name: hotel.name,
  category: "hotel",
  area: hotel.area,
  description: hotel.description,
  priceLabel: priceLabel(hotel.priceLevel),
  bestFor: hotel.bestFor,
  tags: hotel.tags,
  bookingUrl: hotel.bookingUrl,
  bookingLabel: "Check Hotel",
  durationLabel: "Trip base",
  editorialScore: hotel.editorialScore,
}));

export const restaurantListings: DirectoryListing[] = restaurants.map((restaurant) => ({
  id: `restaurant-${restaurant.slug}`,
  slug: restaurant.slug,
  name: restaurant.name,
  category: "restaurant",
  area: restaurant.area,
  venue: restaurant.venue,
  description: restaurant.description,
  priceLabel: priceLabel(restaurant.priceLevel),
  bestFor: restaurant.bestFor,
  tags: [...restaurant.cuisine, ...restaurant.categories, ...restaurant.vibeTags],
  bookingUrl: restaurant.reservationUrl,
  bookingLabel: restaurant.reservationUrl ? "Reserve Table" : "Find Nearby",
  durationLabel: "Allow 60-120 min",
  editorialScore: restaurant.editorialScore,
}));

const experienceSource = [...freeExperienceStops, ...attractionStops];

export const experienceListings: DirectoryListing[] = experienceSource
  .filter((stop, index, items) => items.findIndex((item) => item.name === stop.name) === index)
  .map((stop) => {
    const category = stop.tags.includes("shopping") ? "shopping" : stop.tags.includes("free") ? "free" : "attraction";
    return {
      id: `experience-${slugify(stop.name)}`,
      slug: slugify(stop.name),
      name: stop.name,
      category,
      area: stop.area,
      description: stop.description,
      priceLabel: category === "free" || category === "shopping" ? "Free to explore" : priceLabel(stop.budget),
      bestFor: stop.tags.filter((tag) => !["free", "mid", "premium", "value"].includes(tag)).slice(0, 4),
      tags: stop.tags,
      bookingLabel: "View Details",
      durationLabel: category === "free" || category === "shopping" ? "Flexible timing" : "Allow 60-120 min",
      editorialScore: category === "free" ? 88 : 84,
    } satisfies DirectoryListing;
  });

export const directoryListings = [...hotelListings, ...restaurantListings, ...experienceListings];

export function getDirectoryListingBySlug(slug: string) {
  return directoryListings.find((listing) => listing.slug === slug);
}
