import { expect, test } from "@playwright/test";

/**
 * Every other trip-builder spec mocks /api/planner, so the path from the form
 * through the real itinerary engine to the rendered plan was never covered.
 * This one lets the request reach the live route.
 *
 * No TICKETMASTER_API_KEY is set in CI, so the planner falls back to the
 * curated seed inventory. That is the point: the assertions below are about the
 * itinerary being built and rendered at all, not about which events appear.
 */
test("the planner builds and renders a real itinerary end to end", async ({ page }) => {
  // The build deliberately holds a minimum duration before revealing the plan.
  test.setTimeout(120_000);

  const arrival = new Date();
  arrival.setUTCDate(arrival.getUTCDate() + 30);
  const departure = new Date(arrival);
  departure.setUTCDate(departure.getUTCDate() + 2);

  // Saving needs Supabase, which CI does not configure. The failure is handled
  // and keeps the plan on screen instead of redirecting, which is what we want
  // to inspect here.
  await page.route("**/api/plans", (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));

  await page.goto("/planner");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByTestId("arrival-date").fill(arrival.toISOString().slice(0, 10));
  await page.getByTestId("departure-date").fill(departure.toISOString().slice(0, 10));
  await page.getByLabel("Describe your perfect Vegas experience").fill("A memorable first trip with a great show.");
  await page.getByRole("button", { name: "Under $100 per person" }).click();
  await page.getByRole("button", { name: "friends trip" }).click();

  await page.getByTestId("planner-primary-cta").click();
  await expect(page.getByText("Tune your itinerary")).toBeVisible();
  await page.getByTestId("planner-primary-cta").click();

  const itinerary = page.getByTestId("timed-itinerary").first();
  await expect(itinerary).toBeAttached({ timeout: 90_000 });

  const itineraryText = await itinerary.innerText();

  // A plan is only useful if its blocks carry real clock times.
  const times = itineraryText.match(/\b\d{1,2}:\d{2}\s?(AM|PM)\b/g) || [];
  expect(times.length).toBeGreaterThanOrEqual(3);

  // Times must run forward within the rendered day, which is what the schedule
  // sanitizer exists to guarantee.
  const minutes = times.map((value) => {
    const [, rawHour, rawMinute, period] = value.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i) as RegExpMatchArray;
    let hour = Number(rawHour) % 12;
    if (period.toUpperCase() === "PM") hour += 12;
    return hour * 60 + Number(rawMinute);
  });
  expect([...minutes].sort((a, b) => a - b)).toEqual(minutes);

  // The booking checklist is how the plan converts, so it must survive too.
  await expect(page.getByTestId("plan-booking-checklist").first()).toBeAttached();
  await expect(page.getByText(/per person/i).first()).toBeAttached();
});
