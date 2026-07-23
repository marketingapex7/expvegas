import { expect, test } from "@playwright/test";

test("location pages explain cost, timing, fit, booking, and nearby options", async ({ page }) => {
  await page.goto("/places/bellagio-las-vegas");

  await expect(page.getByRole("heading", { level: 1, name: "Bellagio" })).toBeVisible();
  await expect(page.getByText("$320-$650 per night")).toBeVisible();
  await expect(page.getByText("Your full stay")).toBeVisible();
  await expect(page.getByText("Mixed", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Good fit when" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Skip it when" })).toBeVisible();
  await expect(page.getByText("Booking approach")).toBeVisible();
  await expect(page.getByRole("heading", { name: "More useful picks in Center Strip." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Useful guides around this choice." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Things To Do Near Bellagio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Best Hotels on the Las Vegas Strip" })).toBeVisible();
  await expect(page.getByRole("complementary").getByRole("button", { name: "Add to Itinerary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Map" })).toHaveAttribute("target", "_blank");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("directory filters combine neighborhood, setting, booking style, and vibe", async ({ page }) => {
  await page.goto("/las-vegas-restaurants");

  await page.getByLabel("Neighborhood").selectOption("North Strip");
  await page.getByRole("button", { name: /More filters/ }).click();
  await page.getByLabel("Setting").selectOption("indoor");
  await page.getByLabel("Planning style").selectOption("plan-ahead");
  await page.getByLabel("Vibe").selectOption("romantic");

  await expect(page.getByRole("heading", { name: "SW Steakhouse" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Golden Steer Steakhouse" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Clear 4" })).toBeVisible();

  await page.getByRole("button", { name: "Clear 4" }).click();
  await expect(page.getByText("6 choices", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Compare Golden Steer Steakhouse" }).click();
  await page.getByRole("button", { name: "Compare SW Steakhouse" }).click();
  await expect(page.getByTestId("comparison-bar")).toContainText("2 of 3 selected");
  await page.getByRole("button", { name: "Compare 2 picks" }).click();
  const comparison = page.getByTestId("comparison-panel");
  await expect(comparison.getByRole("heading", { name: "Compare your Vegas picks" })).toBeVisible();
  await expect(comparison.getByText("Golden Steer Steakhouse")).toBeVisible();
  await expect(comparison.getByText("SW Steakhouse")).toBeVisible();

  await page.getByRole("button", { name: "Map view" }).click();
  const map = page.getByTestId("browse-map-view");
  await expect(map).toBeVisible();
  await expect(map.getByRole("link", { name: "View Golden Steer Steakhouse" })).toBeVisible();
  await expect(map.getByRole("link", { name: "View SW Steakhouse" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("button", { name: /More filters/ })).toBeVisible();
  await expect(page.getByLabel("Setting")).toBeHidden();
  await page.getByRole("button", { name: /More filters/ }).click();
  await expect(page.getByLabel("Setting")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
