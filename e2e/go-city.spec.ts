import { expect, test } from "@playwright/test";

test("renders the Go City catalog and pass links", async ({ page }) => {
  await page.goto("/go-city-las-vegas");
  await expect(page.getByRole("heading", { name: /48 included Vegas attractions and offers/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "View pass" })).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "The Mob Museum", exact: true })).toBeVisible();
});
