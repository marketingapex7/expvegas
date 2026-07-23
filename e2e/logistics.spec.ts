import { expect, test } from "@playwright/test";
import { sanitizeSchedule } from "@/lib/itinerary-engine";
import { estimateVegasTravel, inferVegasZone } from "@/lib/vegas-logistics";

test("Vegas zone estimates distinguish short clusters from cross-city jumps", () => {
  expect(inferVegasZone("Sphere at The Venetian")).toBe("North Strip");
  expect(inferVegasZone("Allegiant Stadium")).toBe("South Strip");

  const sameArea = estimateVegasTravel("Bellagio", "Bellagio");
  expect(sameArea).toMatchObject({ minMinutes: 5, maxMinutes: 10 });

  const longJump = estimateVegasTravel("Allegiant Stadium", "Fremont Street");
  expect(longJump).toMatchObject({
    fromZone: "South Strip",
    toZone: "Downtown",
    minMinutes: 30,
    maxMinutes: 50,
  });
});

test("schedule sanitation protects fixed events with zone-aware travel time", () => {
  const schedule = sanitizeSchedule([
    {
      time: "6:00 PM",
      title: "Dinner at Mandalay Bay",
      category: "meal",
      location: "Mandalay Bay",
      durationMinutes: 90,
    },
    {
      time: "8:00 PM",
      title: "Sphere show",
      category: "event",
      location: "Sphere",
      durationMinutes: 120,
    },
  ]);

  expect(schedule[0].time).toBe("5:45 PM");
  expect(schedule[0].timingNote).toContain("protect the fixed event start");
  expect(schedule[1].time).toBe("8:00 PM");
});

test("My Itinerary persists reordered picks and recalculates travel estimates", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("experiencevegas.trip-picks.v1", JSON.stringify([
      {
        id: "e2e-center-dinner",
        slug: "golden-steer-steakhouse",
        name: "Center Strip Dinner",
        category: "restaurant",
        area: "Bellagio",
        zone: "Center Strip",
        description: "Dinner anchor.",
        imageUrl: "",
        priceLabel: "$75",
        durationLabel: "90 minutes",
        detailUrl: "/places/golden-steer-steakhouse",
        estimatedCostMin: 75,
        estimatedCostMax: 100,
        costUnit: "per-person",
        status: "must-do",
      },
      {
        id: "e2e-downtown-stop",
        slug: "fremont-street-experience",
        name: "Fremont Street",
        category: "free",
        area: "Downtown",
        zone: "Downtown",
        description: "Downtown stop.",
        imageUrl: "",
        priceLabel: "Free",
        durationLabel: "90 minutes",
        detailUrl: "/places/fremont-street-experience",
        estimatedCostMin: 0,
        estimatedCostMax: 0,
        costUnit: "free",
        status: "considering",
      },
    ]));
    localStorage.setItem("experiencevegas.trip-dates.v1", JSON.stringify({
      arrivalDate: "2026-08-14",
      departureDate: "2026-08-17",
    }));
    localStorage.setItem("experiencevegas.trip-settings.v1", JSON.stringify({
      partySize: 2,
      budgetCap: 1_000,
    }));
  });

  await page.goto("/my-trip");
  const travelReality = page.getByTestId("travel-reality");
  await expect(travelReality).toBeVisible();
  await expect(travelReality).toContainText("Center Strip Dinner to Fremont Street");
  await expect(travelReality).toContainText("20-35 min");

  const source = page.getByTestId("reorder-handle-e2e-center-dinner");
  const target = page.getByTestId("itinerary-item-e2e-downtown-stop");
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await source.dispatchEvent("dragstart", { dataTransfer });
  await target.dispatchEvent("dragenter", { dataTransfer });
  await target.dispatchEvent("dragover", { dataTransfer });
  await target.dispatchEvent("drop", { dataTransfer });
  await source.dispatchEvent("dragend", { dataTransfer });
  await expect(travelReality).toContainText("Fremont Street to Center Strip Dinner");
  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("experiencevegas.trip-picks.v1") || "[]") as { id: string }[];
    return stored[0]?.id;
  })).toBe("e2e-downtown-stop");

  await page.reload();
  await expect(page.getByTestId("travel-reality")).toContainText("Fremont Street to Center Strip Dinner");
  await page.getByRole("button", { name: "Move Center Strip Dinner up" }).click();
  await expect(page.getByTestId("travel-reality")).toContainText("Center Strip Dinner to Fremont Street");
  await page.getByRole("button", { name: "Move Fremont Street up" }).click();
  await expect(page.getByTestId("travel-reality")).toContainText("Fremont Street to Center Strip Dinner");

  await page.getByRole("button", { name: "Itinerary map view" }).click();
  const map = page.getByTestId("itinerary-map-view");
  await expect(map).toBeVisible();
  await expect(map.getByRole("link", { name: "View Fremont Street" })).toBeVisible();
  await expect(map.getByRole("link", { name: "View Center Strip Dinner" })).toBeVisible();
});

test("booked itinerary picks stay fixed when adjacent picks are reordered", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("experiencevegas.trip-picks.v1", JSON.stringify([
      {
        id: "e2e-flexible-one",
        slug: "fremont-street-experience",
        name: "Flexible First",
        category: "free",
        area: "Downtown",
        zone: "Downtown",
        description: "Flexible stop.",
        imageUrl: "",
        priceLabel: "Free",
        durationLabel: "60 minutes",
        detailUrl: "/places/fremont-street-experience",
        status: "considering",
      },
      {
        id: "e2e-booked",
        slug: "o-cirque-du-soleil",
        name: "Booked Show",
        category: "event",
        area: "Bellagio",
        zone: "Center Strip",
        description: "Fixed show.",
        imageUrl: "",
        priceLabel: "$125",
        durationLabel: "90 minutes",
        detailUrl: "/shows/o-cirque-du-soleil",
        status: "booked",
        locked: true,
      },
      {
        id: "e2e-flexible-two",
        slug: "bellagio-fountains-and-conservatory",
        name: "Flexible Last",
        category: "free",
        area: "Bellagio",
        zone: "Center Strip",
        description: "Flexible stop.",
        imageUrl: "",
        priceLabel: "Free",
        durationLabel: "60 minutes",
        detailUrl: "/places/bellagio-fountains-and-conservatory",
        status: "considering",
      },
    ]));
  });

  await page.goto("/my-trip");
  await expect(page.getByRole("button", { name: "Move Flexible Last up" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Move Flexible First down" })).toBeDisabled();
});
