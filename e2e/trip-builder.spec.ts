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

test("homepage collects all three steps and builds the itinerary only on submit", async ({ page }) => {
  let plannerRequest: Record<string, unknown> = {};
  let plannerRequestCount = 0;
  let savedInput: Record<string, unknown> = {};

  await page.route("**/api/planner", async (route) => {
    plannerRequestCount += 1;
    plannerRequest = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(plannerResponse) });
  });
  await page.route("**/api/plans", async (route) => {
    savedInput = (route.request().postDataJSON() as { input: Record<string, unknown> }).input;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ shareToken: "homepage-build", expiresAt: "2026-08-30T00:00:00.000Z" }),
    });
  });

  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");

  // All three steps are on the page from the first paint. Reaching the
  // preference questions used to cost a click and a navigation.
  const stepTwo = page.getByTestId("home-step-two");
  const stepThree = page.getByTestId("home-step-three");
  await expect(page.getByTestId("home-step-one")).toBeVisible();
  await expect(stepTwo).toBeVisible();
  await expect(stepThree).toBeVisible();

  await page.getByLabel("Travelers", { exact: true }).selectOption("4");
  await stepTwo.getByRole("button", { name: "friends trip" }).click();
  await stepThree.getByRole("button", { name: "Steakhouse", exact: true }).click();
  await stepThree.getByRole("button", { name: "Late nights", exact: true }).click();
  await page.getByLabel("Anything else we should know?").fill("Celebrating a birthday.");

  // Filling the form plans nothing. Every answer is held until one submit, so a
  // visitor working down the page never triggers a build they did not ask for.
  await page.waitForTimeout(1_000);
  expect(plannerRequestCount).toBe(0);
  await expect(page).toHaveURL(/\/$/);

  await page.getByTestId("home-create-itinerary").click();
  // The saved-plan route is force-dynamic and compiles on first hit in dev, so
  // this is a slow navigation rather than the default assertion window.
  await expect(page).toHaveURL(/\/plan\/homepage-build$/, { timeout: 20_000 });

  // One build, carrying every answer, and the saved plan is that same trip.
  expect(plannerRequestCount).toBe(1);
  expect(plannerRequest.partySize).toBe(4);
  expect(plannerRequest.groupType).toBe("friends trip");
  expect(plannerRequest.foodPreference).toBe("Steakhouse");
  expect(plannerRequest.pace).toBe("Late nights");
  expect(plannerRequest.additionalDetails).toContain("birthday");
  expect(savedInput.partySize).toBe(4);
  expect(savedInput.groupType).toBe("friends trip");
});

test("trip builder advances from dates through a completed game plan", async ({ page }) => {
  let plannerRequest: Record<string, string> = {};
  const arrivalDate = new Date();
  arrivalDate.setUTCDate(arrivalDate.getUTCDate() + 30);
  const departureDate = new Date(arrivalDate);
  departureDate.setUTCDate(departureDate.getUTCDate() + 3);
  const arrivalValue = arrivalDate.toISOString().slice(0, 10);
  const departureValue = departureDate.toISOString().slice(0, 10);
  const expectedDateSummary = `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(arrivalDate)} to ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(departureDate)}`;

  await page.route("**/api/planner", async (route) => {
    plannerRequest = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(plannerResponse) });
  });
  await page.route("**/api/plans", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.goto("/planner");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const arrival = page.getByTestId("arrival-date");
  const departure = page.getByTestId("departure-date");
  const primaryCta = page.getByTestId("planner-primary-cta");

  await expect(primaryCta).toBeEnabled();
  await expect(primaryCta).toContainText("Browse Vegas Ideas");

  await arrival.fill(arrivalValue);
  await departure.focus();
  await departure.blur();
  await expect(page.locator("#departure-date-error")).toHaveText("Choose your departure date.");
  await departure.fill(departureValue);

  await expect(page.getByTestId("date-status")).toContainText(expectedDateSummary);
  await expect(primaryCta).toBeEnabled();
  await expect(primaryCta).toContainText("Continue to Trip Details");

  await page.getByLabel("Describe your perfect Vegas experience").fill("A memorable first trip with a great show and relaxed meals.");
  const underHundredTickets = page.getByRole("button", { name: "Under $100 per person" });
  const midrangeTickets = page.getByRole("button", { name: "$100-$200 per person" });
  await underHundredTickets.click();
  await midrangeTickets.click();
  await expect(underHundredTickets).toHaveAttribute("aria-pressed", "true");
  await expect(midrangeTickets).toHaveAttribute("aria-pressed", "true");
  await primaryCta.click();

  await expect(page.getByText("Tune your itinerary")).toBeVisible();
  const valueMeals = page.getByRole("button", { name: "Under $30 per person" });
  const premiumMeals = page.getByRole("button", { name: "$60-$120 per person" });
  await valueMeals.click();
  await premiumMeals.click();
  await expect(valueMeals).toHaveAttribute("aria-pressed", "true");
  await expect(premiumMeals).toHaveAttribute("aria-pressed", "true");

  await page.getByText("Optional gambling and logistics preferences").click();
  const lightBankroll = page.getByRole("button", { name: "Bankroll under $100" });
  const tableGames = page.getByRole("button", { name: "Table games" });
  const noGambling = page.getByRole("button", { name: "No gambling" });
  await lightBankroll.click();
  await tableGames.click();
  await noGambling.click();
  await expect(noGambling).toHaveAttribute("aria-pressed", "true");
  await expect(lightBankroll).toHaveAttribute("aria-pressed", "false");
  await expect(tableGames).toHaveAttribute("aria-pressed", "false");

  const mediumBankroll = page.getByRole("button", { name: "Bankroll $100-$300" });
  const sportsbook = page.getByRole("button", { name: "Sportsbook" });
  await mediumBankroll.click();
  await sportsbook.click();
  await expect(noGambling).toHaveAttribute("aria-pressed", "false");
  await expect(mediumBankroll).toHaveAttribute("aria-pressed", "true");
  await expect(sportsbook).toHaveAttribute("aria-pressed", "true");
  await expect(primaryCta).toContainText("Plan My Trip");
  await primaryCta.click();

  await expect(page.getByText("Planning your Vegas trip")).toBeVisible();
  const analysisSelections = page.getByTestId("planner-analysis-selections");
  await expect(analysisSelections).toBeVisible();
  expect(await analysisSelections.evaluate((container) => (
    [...container.children].every((child) => child.getBoundingClientRect().bottom <= container.getBoundingClientRect().bottom + 1)
  ))).toBe(true);
  const bookingList = page.getByTestId("plan-booking-checklist");
  await expect(bookingList).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("E2E Vegas Show").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Save as PDF" })).toBeVisible();
  expect(plannerRequest.budget).toContain("Under $100 per person");
  expect(plannerRequest.budget).toContain("$100-$200 per person");
  expect(plannerRequest.mealBudget).toContain("Under $30 per person");
  expect(plannerRequest.mealBudget).toContain("$60-$120 per person");
  expect(plannerRequest.gamblingPreference).toContain("Bankroll $100-$300");
  expect(plannerRequest.gamblingPreference).toContain("Sportsbook");
  expect(plannerRequest.partySize).toBe(2);

  await expect(bookingList.getByText("E2E Dinner")).toBeVisible();
  await expect(bookingList.getByText("E2E Vegas Show")).toBeVisible();
  await expect(bookingList.getByRole("link", { name: "Tickets" })).toHaveAttribute(
    "href",
    "https://tickets.example.com/e2e-vegas-show",
  );
  await expect(bookingList.getByRole("link", { name: "Find booking" })).toHaveAttribute(
    "href",
    /google\.com\/maps\/search/,
  );

  const booked = bookingList.getByRole("checkbox", { name: "E2E Vegas Show booked" });
  await booked.check();
  await expect(booked).toBeChecked();
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith("experiencevegas:booked:")))).toBe(true);
});

test("mobile completed plan prioritizes booking and itinerary before trip details", async ({ page }) => {
  const arrivalDate = new Date();
  arrivalDate.setUTCDate(arrivalDate.getUTCDate() + 30);
  const departureDate = new Date(arrivalDate);
  departureDate.setUTCDate(departureDate.getUTCDate() + 3);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/planner", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(plannerResponse) });
  });
  await page.route("**/api/plans", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.goto("/planner");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByTestId("arrival-date").fill(arrivalDate.toISOString().slice(0, 10));
  await page.getByTestId("departure-date").fill(departureDate.toISOString().slice(0, 10));
  await page.getByLabel("Describe your perfect Vegas experience").fill("A polished weekend with dinner and a show.");
  await page.getByTestId("planner-primary-cta").click();
  await page.getByTestId("planner-primary-cta").click();

  const bookingBar = page.getByTestId("mobile-booking-bar");
  const itinerary = page.getByTestId("timed-itinerary");
  const tripDetails = page.getByTestId("mobile-trip-details");

  await expect(bookingBar).toBeVisible({ timeout: 15_000 });
  await expect(itinerary).toBeVisible();
  await expect(tripDetails).toBeVisible();
  await expect(tripDetails).not.toHaveAttribute("open", "");

  const order = await page.evaluate(() => {
    const schedule = document.querySelector('[data-testid="timed-itinerary"]');
    const details = document.querySelector('[data-testid="mobile-trip-details"]');
    return schedule && details
      ? Boolean(schedule.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false;
  });
  expect(order).toBe(true);

  await tripDetails.getByText("Trip details and assumptions").click();
  await expect(tripDetails).toHaveAttribute("open", "");
  await expect(tripDetails.getByText("Why this plan works")).toBeVisible();

  await bookingBar.getByRole("button", { name: "Review" }).click();
  await expect(page.getByRole("dialog", { name: "Booking checklist" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Booking checklist" }).getByText("E2E Vegas Show")).toBeVisible();
});
