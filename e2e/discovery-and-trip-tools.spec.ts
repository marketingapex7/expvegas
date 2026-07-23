import { expect, test } from "@playwright/test";

const savedRestaurant = {
  id: "e2e-restaurant",
  slug: "e2e-restaurant",
  name: "E2E Steakhouse",
  category: "restaurant",
  area: "Center Strip",
  description: "A saved restaurant used to verify the returning trip experience.",
  imageUrl: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=75",
  priceLabel: "$60-$100 per person",
  durationLabel: "90 minutes",
  detailUrl: "/places/golden-steer-steakhouse",
  estimatedCostMin: 60,
  estimatedCostMax: 100,
  costUnit: "per-person",
  bookingGuidance: "reserve",
  status: "must-do",
  locked: false,
};

async function seedTrip(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate((item) => {
    localStorage.setItem("experiencevegas.trip-picks.v1", JSON.stringify([item]));
    localStorage.setItem(
      "experiencevegas.trip-dates.v1",
      JSON.stringify({ arrivalDate: "2026-08-14", departureDate: "2026-08-17" }),
    );
    localStorage.setItem(
      "experiencevegas.trip-settings.v1",
      JSON.stringify({ partySize: 4, budgetCap: 2_000 }),
    );
  }, savedRestaurant);
}

test("global search finds catalog entries from the header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search Vegas" }).click();
  const dialog = page.getByRole("dialog", { name: "Search ExperienceVegas" });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("Search hotels, restaurants, shows, venues...").fill("Bellagio");
  await expect(dialog.getByRole("link", { name: /Bellagio/i }).first()).toBeVisible();
});

test("Tonight filters explain an empty combination and recover cleanly", async ({ page }) => {
  await page.goto("/tonight");
  await page.getByLabel("Venue or area").fill("not-a-real-vegas-venue");
  await expect(page.getByRole("heading", { name: "No exact matches" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText(/options$/).first()).toBeVisible();
});

test("sample trip fills editable dates and multi-range preferences", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Try sample: weekend for 4" }).click();
  await expect(page.getByTestId("arrival-date")).not.toHaveValue("");
  await expect(page.getByTestId("departure-date")).not.toHaveValue("");
  await expect(page.getByRole("button", { name: "Under $100 per person" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "$100-$200 per person" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Describe your perfect Vegas experience")).toContainText("friends trip");
});

test("returning users see their saved trip, category spend, and PDF action", async ({ page }) => {
  await seedTrip(page);
  await page.reload();
  const preview = page.getByTestId("returning-trip-preview");
  await expect(preview).toBeVisible();
  await expect(preview.getByText("E2E Steakhouse")).toBeVisible();
  await expect(preview).toContainText("$240-$400 estimated");

  await page.goto("/my-trip");
  await expect(page.getByText("Food", { exact: true })).toBeVisible();
  await expect(page.getByText("$240-$400", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Save as PDF" })).toBeVisible();
});
