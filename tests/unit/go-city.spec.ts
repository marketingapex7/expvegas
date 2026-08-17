import { expect, test } from "vitest";
import { goCityAttractions, goCityFlexibleAttractions } from "@/data/go-city-attractions";
import { goCityListings } from "@/lib/directory-data";
import { goCityAffiliateLinks } from "@/lib/go-city";
import { buildItinerary } from "@/lib/itinerary-engine";
import { calculateTripBudget, estimateGoCityItems } from "@/lib/trip-budget";
import { TripPick } from "@/types/directory";

function pick(index: number): TripPick {
  const listing = goCityListings[index];
  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    category: listing.category,
    area: listing.area,
    description: listing.description,
    imageUrl: listing.imageUrl,
    priceLabel: listing.priceLabel,
    durationLabel: listing.durationLabel,
    detailUrl: `/places/${listing.slug}`,
    estimatedCostMin: listing.estimatedCostMin,
    estimatedCostMax: listing.estimatedCostMax,
    costUnit: listing.costUnit,
    provider: listing.provider,
    passTypes: listing.passTypes,
    providerBookingUrl: listing.bookingUrl,
  };
}

test("tracks the full curated Go City catalog with valid affiliate destinations", () => {
  expect(goCityAttractions).toHaveLength(48);
  expect(goCityListings).toHaveLength(48);
  expect(new Set(goCityAttractions.map((item) => item.name)).size).toBe(48);
  expect(Object.values(goCityAffiliateLinks)).toHaveLength(4);

  for (const url of Object.values(goCityAffiliateLinks)) {
    expect(url).toMatch(/^https:\/\/gocity\.tp\.st\//);
  }
  for (const listing of goCityListings) {
    expect(listing.provider).toBe("go-city");
    expect(listing.bookingUrl).toMatch(/^https:\/\/gocity\.tp\.st\//);
  }
});

test("keeps fixed-time Go City products out of auto-scheduled attraction slots", () => {
  expect(goCityFlexibleAttractions.some((item) => item.name === "KA by Cirque du Soleil")).toBe(false);

  const days = buildItinerary({
    plannerInput: {
      travelDates: "2026-08-01 to 2026-08-04",
      prompt: "I want The Mob Museum",
      additionalDetails: "The Mob Museum",
      stayingNear: "Downtown",
    },
    startDate: "2026-08-01",
    endDate: "2026-08-04",
    rankedEvents: [],
  });
  const mobMuseum = days.flatMap((day) => day.blocks).find((block) => block.title === "The Mob Museum");

  expect(mobMuseum?.provider).toBe("go-city");
  expect(mobMuseum?.providerBookingUrl).toMatch(/^https:\/\/gocity\.tp\.st\//);
  expect(mobMuseum?.durationMinutes).toBe(150);
});

test("consolidates eligible attractions into one pass estimate", () => {
  const sharedPassItems = [
    goCityListings.find((item) => item.name === "High Roller Observation Wheel: Daytime Ticket"),
    goCityListings.find((item) => item.name === "Eiffel Tower Experience at Paris Las Vegas"),
    goCityListings.find((item) => item.name === "The Mob Museum"),
  ].map((listing) => {
    if (!listing) throw new Error("Expected Go City listing is missing");
    return pick(goCityListings.indexOf(listing));
  });

  expect(estimateGoCityItems(sharedPassItems, 2)).toEqual({ min: 158, max: 158 });

  const budget = calculateTripBudget(
    sharedPassItems,
    { partySize: 2, budgetCap: 0 },
    { arrivalDate: "2026-08-01", departureDate: "2026-08-04" },
  );
  expect(budget.categories.Experiences).toEqual({ min: 158, max: 158 });
  expect(budget.total).toEqual({ min: 158, max: 158 });
});
