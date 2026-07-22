# Mobile Itinerary Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a functional booking checklist and the timed itinerary ahead of supporting trip details on mobile.

**Architecture:** Derive booking actions from the already-sanitized itinerary shown by `PlanResult`, then render them through a focused client component that persists checked state in local storage. Extract supporting trip context into a reusable presentation component so desktop can keep it expanded above the schedule while mobile places it in a collapsed disclosure below the schedule.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Lucide React, Playwright

## Global Constraints

- Do not add dependencies.
- Do not change planner APIs, persistence schemas, itinerary generation, or product direction.
- Booking links open in a new tab with `noopener noreferrer`.
- Never imply a booking was completed; checked state is a local planning aid.
- Mobile users must reach Book Now and the timed itinerary before supporting trip details.

---

### Task 1: Itinerary-Derived Book Now Checklist

**Files:**
- Create: `components/PlanBookingChecklist.tsx`
- Modify: `components/PlanResult.tsx`
- Test: `e2e/trip-builder.spec.ts`

**Interfaces:**
- Consumes: `planId: string` and `itineraryDays: ItineraryDay[]` from `PlanResult` after `sanitizeSchedule` and swap application.
- Produces: `PlanBookingChecklist({ planId, itineraryDays }: PlanBookingChecklistProps)` and test id `plan-booking-checklist`.

- [ ] **Step 1: Expand the planner fixture and write failing booking tests**

Add a direct booking URL to the event and a meal without a direct URL:

```ts
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
```

After the completed-plan assertion, verify:

```ts
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
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npx playwright test e2e/trip-builder.spec.ts --project=chromium`

Expected: FAIL because `plan-booking-checklist` does not exist.

- [ ] **Step 3: Implement the focused checklist component**

Create `PlanBookingChecklist.tsx` as a client component. Flatten only `event` and `meal` blocks into this shape:

```ts
type BookingItem = {
  key: string;
  dayLabel: string;
  time: string;
  title: string;
  location?: string;
  priceHint?: string;
  category: "event" | "meal";
  url: string;
  direct: boolean;
};
```

Generate keys with `${planId}-${day.date}-${index}-${block.title}`. Use a valid `bookingUrl` when present; otherwise use:

```ts
`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${block.title} ${block.location || "Las Vegas"}`)}`
```

Load and save a `Record<string, boolean>` under `experiencevegas:booked:${planId}` with guarded `try/catch` blocks. Render a white-on-dark compact checklist with native checkboxes, day/time metadata, optional price, and these actions:

```ts
const action = item.direct
  ? item.category === "event" ? "Check Tickets" : "Reserve Table"
  : "Find Booking";
```

Use `target="_blank" rel="noopener noreferrer"` for every action. Render a concise empty state when no booking items exist.

- [ ] **Step 4: Insert the checklist before the itinerary**

In `PlanResult.tsx`, import `PlanBookingChecklist` and render it after the result identity/context area and immediately before the `itineraryDays?.length` schedule branch:

```tsx
{itineraryDays?.length ? (
  <PlanBookingChecklist planId={planId} itineraryDays={itineraryDays} />
) : null}
```

Remove the old plain-string `Book now` card from the trip summary because it duplicates stale, non-actionable data.

- [ ] **Step 5: Run the focused test and lint**

Run: `npx playwright test e2e/trip-builder.spec.ts --project=chromium`

Expected: PASS.

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 6: Commit the booking workflow**

```bash
git add components/PlanBookingChecklist.tsx components/PlanResult.tsx e2e/trip-builder.spec.ts
git commit -m "Add itinerary booking checklist"
```

---

### Task 2: Mobile-First Result Hierarchy

**Files:**
- Create: `components/PlanTripDetails.tsx`
- Modify: `components/PlanResult.tsx`
- Test: `e2e/trip-builder.spec.ts`

**Interfaces:**
- Consumes: `result: PlannerResponse`.
- Produces: `PlanTripDetails({ result }: { result: PlannerResponse })`, mobile disclosure test id `mobile-trip-details`, and schedule test id `timed-itinerary`.

- [ ] **Step 1: Write the failing mobile hierarchy test**

Add a separate test using the existing mocked planner routes and builder helper, then set the viewport before navigation:

```ts
await page.setViewportSize({ width: 390, height: 844 });
```

After the result renders, assert DOM and disclosure behavior:

```ts
const bookingList = page.getByTestId("plan-booking-checklist");
const itinerary = page.getByTestId("timed-itinerary");
const tripDetails = page.getByTestId("mobile-trip-details");

await expect(bookingList).toBeVisible();
await expect(itinerary).toBeVisible();
await expect(tripDetails).toBeVisible();
await expect(tripDetails).not.toHaveAttribute("open", "");

const order = await page.evaluate(() => {
  const booking = document.querySelector('[data-testid="plan-booking-checklist"]');
  const schedule = document.querySelector('[data-testid="timed-itinerary"]');
  const details = document.querySelector('[data-testid="mobile-trip-details"]');
  return booking && schedule && details
    ? Boolean(booking.compareDocumentPosition(schedule) & Node.DOCUMENT_POSITION_FOLLOWING)
      && Boolean(schedule.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING)
    : false;
});
expect(order).toBe(true);

await tripDetails.getByText("Trip details").click();
await expect(tripDetails).toHaveAttribute("open", "");
await expect(tripDetails.getByText("Trip summary")).toBeVisible();
```

- [ ] **Step 2: Run the mobile test and confirm it fails**

Run: `npx playwright test e2e/trip-builder.spec.ts --project=chromium -g "mobile completed plan"`

Expected: FAIL because the disclosure and schedule test ids do not exist.

- [ ] **Step 3: Extract reusable trip context**

Create `PlanTripDetails.tsx` as a presentation component. Move the recommendation rationale, source summary, trip summary, lodging, spend, style, best lodging zone, assumptions, and Keep Flexible list from `PlanResult` into it. Do not render the old `tripSummary.bookNow` string list. Keep the planning disclaimer at the bottom of this component.

- [ ] **Step 4: Reorder responsive sections in PlanResult**

Use this responsive structure:

```tsx
<div className="hidden md:block">
  <PlanTripDetails result={result} />
</div>

<PlanBookingChecklist planId={planId} itineraryDays={itineraryDays} />

<div data-testid="timed-itinerary">
  {/* existing sticky day navigation and daily itinerary */}
</div>

<details data-testid="mobile-trip-details" className="mt-5 rounded-lg border border-white/10 bg-black/20 md:hidden">
  <summary className="cursor-pointer list-none px-4 py-4 text-sm font-black text-white">
    Trip details
  </summary>
  <div className="border-t border-white/10 p-4">
    <PlanTripDetails result={result} />
  </div>
</details>
```

Keep a compact mobile result identity above Book Now, but hide the long rationale there. In the save panel, hide the raw share URL and expiration paragraph below `sm`, retain copy/save and calendar buttons, and shorten unsaved failure/help copy on mobile. Preserve the current desktop save content.

- [ ] **Step 5: Run mobile and full flow tests**

Run: `npx playwright test e2e/trip-builder.spec.ts --project=chromium`

Expected: all tests PASS.

- [ ] **Step 6: Run full verification**

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: Next.js production build completes successfully.

Run: `npm run test:e2e`

Expected: all Playwright tests PASS.

- [ ] **Step 7: Inspect mobile and desktop screenshots**

Use Playwright at `390x844` and `1440x1000` to capture the completed result. Confirm no overlap, Book Now precedes the timed itinerary, Trip Details is collapsed on mobile, and the desktop context remains expanded.

- [ ] **Step 8: Commit responsive hierarchy changes**

```bash
git add components/PlanTripDetails.tsx components/PlanResult.tsx e2e/trip-builder.spec.ts
git commit -m "Prioritize itinerary on mobile results"
```
