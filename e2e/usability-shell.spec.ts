import { expect, test } from "@playwright/test";

test("guessable routes and branded not-found page keep visitors oriented", async ({ page }) => {
  await page.goto("/hotels");
  await expect(page).toHaveURL(/\/las-vegas-hotels$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Las Vegas Hotels");

  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vegas plan back on track");
  await expect(page.getByRole("main").getByRole("link", { name: "Plan my trip" })).toBeVisible();
});

test("desktop dropdowns stay open while the pointer enters the menu", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/las-vegas-shows");

  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  const trigger = navigation.getByRole("link", { name: "Shows & Events", exact: true });
  const submenuLink = navigation.getByRole("link", { name: "Shows under $100", exact: true });
  await trigger.hover();
  await expect(submenuLink).toBeVisible();

  const triggerBox = await trigger.boundingBox();
  if (!triggerBox) throw new Error("Desktop menu trigger has no bounding box");
  await page.mouse.move(triggerBox.x + triggerBox.width / 2, triggerBox.y + triggerBox.height + 6, { steps: 4 });
  await expect(submenuLink).toBeVisible();
  await submenuLink.hover();
  await expect(submenuLink).toBeVisible();
});

test("mobile navigation keeps the cold homepage free of itinerary chrome", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const trayButton = page.getByRole("button", { name: /Open My Itinerary/ });
  await expect(trayButton).toBeHidden();
  await expect(page.getByTestId("returning-trip-preview")).toBeHidden();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(trayButton).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Plan my trip" })).toBeVisible();

  await page.goto("/my-trip");
  await expect(page.getByRole("heading", { name: "My Itinerary" })).toBeVisible();
  await expect(page.getByText("Plan health", { exact: true })).toBeHidden();
  await expect(page.getByText("Add picks to see an estimate.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Open My Itinerary/ })).toBeHidden();
});

test("homepage proves the planner first and keeps low inventory compact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByTestId("homepage-live-plan")).toBeVisible();
  await expect(page.getByTestId("homepage-live-plan").getByText(/Allow \d+-\d+ min between stops/).first()).toBeVisible();
  const livePlan = page.getByTestId("homepage-live-plan");
  // Scope to day one. Day two lives inside a collapsed <details> and is still in
  // the DOM, so counting the whole card cannot distinguish these two states.
  const dayOneBlocks = livePlan.locator("article:not(details article)");
  const dayOneAnchor = dayOneBlocks.filter({ has: page.getByText("Event", { exact: true }) });
  const dayOneOpenEvening = dayOneBlocks.filter({ hasText: "Open evening for a last-minute show or lounge" });

  // Day one resolves its evening exactly one way: a confirmed provider anchor,
  // or an explicitly open slot. Never both, and never neither.
  expect(await dayOneAnchor.count() + await dayOneOpenEvening.count()).toBe(1);
  await expect(page.getByText("Prices are planning estimates, not quotes")).toBeVisible();
  const eventCount = await page.getByTestId("home-events").locator("article").count();
  expect(eventCount).toBeGreaterThanOrEqual(3);
  expect(eventCount).toBeLessThanOrEqual(6);
  await expect(page.getByTestId("home-worth-rail").locator("article")).toHaveCount(6);
  await expect(page.getByTestId("home-hotels")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browse all choices" })).toHaveCount(0);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await expect(page.getByTestId("homepage-live-plan")).toBeVisible();
  await expect(page.getByTestId("home-worth-rail").locator("article:visible")).toHaveCount(6);
});

test("homepage plan controls drop down from anywhere in the control, including the chevron", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  for (const name of ["Travelers", "Budget"]) {
    const select = page.getByLabel(name, { exact: true });
    await expect(select).toBeVisible();

    // A native select cannot be opened programmatically, so what is worth
    // asserting is hit testing: every point inside the control has to land on
    // the select. Beside it the icons were topmost over their own area, and a
    // label forwards a click to a select as focus only, so the menu never
    // dropped. The corners matter too, because the control is a grid item that
    // stretches taller than the select's own line height.
    const misses = await select.evaluate((element) => {
      const label = element.closest("label");
      if (!label) return ["no label"];

      const bounds = label.getBoundingClientRect();
      const icons = [...label.querySelectorAll("svg")].map((icon) => {
        const box = icon.getBoundingClientRect();
        return { name: "icon", x: box.left + box.width / 2, y: box.top + box.height / 2 };
      });
      const corners = [
        { name: "top-left", x: bounds.left + 2, y: bounds.top + 2 },
        { name: "top-right", x: bounds.right - 2, y: bounds.top + 2 },
        { name: "bottom-left", x: bounds.left + 2, y: bounds.bottom - 2 },
        { name: "bottom-right", x: bounds.right - 2, y: bounds.bottom - 2 },
        { name: "center", x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 },
      ];

      return [...icons, ...corners]
        .filter((point) => document.elementFromPoint(point.x, point.y) !== element)
        .map((point) => `${point.name} hits ${document.elementFromPoint(point.x, point.y)?.tagName.toLowerCase() || "nothing"}`);
    });

    expect(misses, `${name} control has unclickable areas`).toEqual([]);
  }
});
