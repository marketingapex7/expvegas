import { expect, test } from "@playwright/test";

test("guessable routes and branded not-found page keep visitors oriented", async ({ page }) => {
  await page.goto("/hotels");
  await expect(page).toHaveURL(/\/las-vegas-hotels$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Las Vegas Hotels");

  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vegas plan back on track");
  await expect(page.getByRole("main").getByRole("link", { name: "Build My Experience" })).toBeVisible();
});

test("mobile navigation hides the floating tray and empty itinerary metrics stay honest", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const trayButton = page.getByRole("button", { name: /Open My Itinerary/ });
  await expect(trayButton).toBeVisible();
  const trayBox = await trayButton.boundingBox();
  expect(trayBox?.width).toBeLessThanOrEqual(56);
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(trayButton).toBeHidden();

  await page.goto("/my-trip");
  await expect(page.getByRole("heading", { name: "My Itinerary" })).toBeVisible();
  await expect(page.getByText("Plan health", { exact: true })).toBeHidden();
  await expect(page.getByText("Add picks to see an estimate.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Open My Itinerary/ })).toBeHidden();
});
