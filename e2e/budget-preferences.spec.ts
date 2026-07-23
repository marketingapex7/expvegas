import { expect, test } from "@playwright/test";
import {
  diversifyEventsByTicketBudget,
  mealLevelsFromText,
  ticketBandsFromText,
} from "../lib/budget-preferences";
import { VegasEvent } from "../types/event";

function event(id: string, priceMin: number): VegasEvent {
  return {
    id,
    name: id,
    slug: id,
    category: "shows",
    venueName: "Test Venue",
    area: "Strip",
    priceMin,
    tags: [],
    bestFor: [],
    skipIf: [],
    shortDescription: id,
    quickVerdict: id,
    affiliateUrl: `https://example.com/${id}`,
    editorialScore: 80,
    valueScore: 80,
    wowScore: 80,
    familyScore: 80,
    couplesScore: 80,
    bachelorScore: 80,
  };
}

test("parses every selected ticket range from a mixed preference", () => {
  expect(
    ticketBandsFromText(
      "Mix ticket options across: Under $100 per person; $100-$200 per person; $350+ splurge.",
    ),
  ).toEqual(["under-100", "100-200", "350-plus"]);
});

test("diversifies ranked events across selected ticket ranges", () => {
  const ranked = [
    event("cheap-one", 45),
    event("cheap-two", 70),
    event("mid-one", 135),
    event("premium-one", 225),
  ];

  expect(
    diversifyEventsByTicketBudget(
      ranked,
      "Mix ticket options across Under $100 per person and $100-$200 per person.",
    )
      .slice(0, 2)
      .map(({ id }) => id),
  ).toEqual(["cheap-one", "mid-one"]);
});

test("maps multiple meal ranges to the restaurant price levels they support", () => {
  expect(
    mealLevelsFromText("Mix meals across Under $30 per person and $60-$120 per person."),
  ).toEqual(["value", "premium"]);
});
