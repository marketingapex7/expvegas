import { expect, test } from "@playwright/test";

const plannerResponse = {
  headline: "Your Vegas weekend is ready",
  bestPickId: "e2e-show",
  bestPickName: "E2E Vegas Show",
  whyItFits: "A reliable anchor for the dates and preferences selected in the trip builder.",
  timeline: [],
  backupPickIds: [],
  backupPickNames: [],
  sourceSummary: "Smoke-test itinerary",
  itineraryDays: [{
    date: "2026-08-14",
    label: "Friday, Aug 14",
    theme: "Arrival and a strong first night",
    blocks: [
      {
        time: "6:00 PM",
        title: "E2E Dinner",
        category: "meal",
        location: "Center Strip",
        description: "Dinner before the show.",
        durationMinutes: 75,
      },
      {
        time: "8:00 PM",
        title: "E2E Vegas Show",
        category: "event",
        location: "Center Strip",
        description: "A representative event used to verify the complete planning flow.",
        bookingUrl: "https://tickets.example.com/e2e-vegas-show",
        priceHint: "From $89",
        durationMinutes: 90,
      },
    ],
  }],
  tripSummary: {
    lodging: "Not booked yet",
    tripStyle: ["Balanced"],
    estimatedSpend: "$100-$200 per person before hotel",
    bookNow: ["E2E Vegas Show"],
    keepFlexible: [],
    whyThisPlanWorks: "It preserves travel time and gives the trip one clear anchor.",
  },
};

test("trip builder advances from dates through a completed game plan", async ({ page }) => {
  const arrivalDate = new Date();
  arrivalDate.setUTCDate(arrivalDate.getUTCDate() + 30);
  const departureDate = new Date(arrivalDate);
  departureDate.setUTCDate(departureDate.getUTCDate() + 3);
  const arrivalValue = arrivalDate.toISOString().slice(0, 10);
  const departureValue = departureDate.toISOString().slice(0, 10);
  const expectedDateSummary = `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(arrivalDate)} to ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(departureDate)}`;

  await page.route("**/api/planner", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(plannerResponse) });
  });
  await page.route("**/api/plans", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const arrival = page.getByTestId("arrival-date");
  const departure = page.getByTestId("departure-date");
  const primaryCta = page.getByTestId("planner-primary-cta");

  await expect(page.getByTestId("date-status")).toContainText("Add your arrival and departure dates");
  await expect(primaryCta).toBeDisabled();

  await arrival.fill(arrivalValue);
  await departure.focus();
  await departure.blur();
  await expect(page.locator("#departure-date-error")).toHaveText("Choose your departure date.");
  await departure.fill(departureValue);

  await expect(page.getByTestId("date-status")).toContainText(expectedDateSummary);
  await expect(primaryCta).toBeEnabled();
  await expect(primaryCta).toContainText("Continue to Trip Details");

  await page.getByLabel("Describe your perfect Vegas experience").fill("A memorable first trip with a great show and relaxed meals.");
  await primaryCta.click();

  await expect(page.getByText("Tune your itinerary")).toBeVisible();
  await expect(primaryCta).toContainText("Build My Game Plan");
  await primaryCta.click();

  await expect(page.getByText("Building your Vegas game plan")).toBeVisible();
  await expect(page.getByText("Your Vegas weekend is ready")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("E2E Vegas Show").first()).toBeVisible();

  const bookingList = page.getByTestId("plan-booking-checklist");
  await expect(bookingList).toBeVisible();
  await expect(bookingList.getByText("E2E Dinner")).toBeVisible();
  await expect(bookingList.getByText("E2E Vegas Show")).toBeVisible();
  await expect(bookingList.getByRole("link", { name: "Check Tickets" })).toHaveAttribute(
    "href",
    "https://tickets.example.com/e2e-vegas-show",
  );
  await expect(bookingList.getByRole("link", { name: "Find Booking" })).toHaveAttribute(
    "href",
    /google\.com\/maps\/search/,
  );

  const booked = bookingList.getByRole("checkbox", { name: "E2E Vegas Show booked" });
  await booked.check();
  await expect(booked).toBeChecked();
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith("experiencevegas:booked:")))).toBe(true);
});
