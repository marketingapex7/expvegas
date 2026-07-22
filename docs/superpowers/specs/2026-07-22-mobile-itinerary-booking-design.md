# Mobile Itinerary and Booking Design

## Goal

Make the completed Vegas plan useful within the first mobile viewport after the result header. Users should be able to identify what must be booked, take action, and reach the timed itinerary without scrolling through several screens of supporting explanation.

## Result Hierarchy

On mobile, the completed-plan view uses this order:

1. Compact result identity and save/share controls.
2. Book Now checklist.
3. Sticky itinerary day navigation.
4. Timed daily itinerary.
5. Collapsible Trip Details containing the recommendation rationale, lodging guidance, spend estimate, style, assumptions, flexible ideas, source summary, and planning disclaimer.
6. Existing email/share follow-up content.

Desktop keeps the existing expanded context, but receives the same functional Book Now checklist before the itinerary.

## Book Now Checklist

The checklist is derived from the sanitized itinerary currently displayed to the user, including swapped selections. It includes event and meal blocks because those are the categories that normally require advance action.

Each item displays:

- Day label and scheduled time.
- Item title and location.
- Price hint when available.
- A category-appropriate external action: Check Tickets, Reserve Table, or Find Booking.
- A local completion checkbox labeled Booked.

Items with a valid booking URL link directly to that URL in a new tab. Items without one use a targeted Google search or Maps query and are labeled Find Booking, avoiding a false claim that a direct reservation is available.

Checkbox state persists in local storage using the plan identity and itinerary slot. It is planning state only and does not claim that a transaction was completed. Swapping an itinerary item resets the displayed state for that slot because the checklist key includes the selected item title.

If no event or meal blocks exist, the checklist shows a concise message that the plan currently has no advance-booking items.

## Responsive Behavior

The mobile save panel removes the exposed URL and long explanatory copy. Save, copy, and calendar actions remain available in a compact action row. The recommendation rationale and summary cards move into a native disclosure element labeled Trip Details, collapsed by default below the itinerary.

On desktop, Trip Details remains expanded and the existing explanatory hierarchy is preserved. The checklist uses a multi-column layout where space permits and a single-column list on mobile.

The day navigation remains sticky and appears immediately after Book Now so users can jump into the schedule without passing supporting content.

## Data and Components

No API or database schema changes are required. `PlanResult` derives booking items from `itineraryDays` after schedule sanitization and swaps. Small local helper functions classify booking categories, generate stable keys, and choose direct or fallback URLs.

The implementation may extract the checklist and trip details into local components if that keeps `PlanResult` readable, but it will not introduce a new dependency.

## Accessibility and Error Handling

- Checklist completion uses native checkboxes with explicit labels.
- External actions clearly indicate their purpose and retain `noopener noreferrer`.
- The Trip Details disclosure uses native `details` and `summary` semantics.
- Missing URLs fall back to discovery rather than rendering inert controls.
- Save failures remain visible but do not block itinerary access.

## Verification

- Unit-level checks cover booking-item derivation and fallback behavior where practical.
- Existing lint and production build must pass.
- Playwright verifies the completed-plan ordering on mobile, Book Now actions, checkbox persistence, collapsed Trip Details, and desktop visibility.
- Mobile screenshots confirm the first itinerary day is reachable after a compact result header and booking list, with no overlapping sticky controls.
