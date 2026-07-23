# Mixed Budget Selections Design

## Goal

Let travelers select multiple acceptable spending bands for tickets, food, and gambling so the planner can present a useful mix instead of forcing one budget level.

## Selection Experience

The planner labels ticket budget, food spend, and gambling bankroll with `Choose all that fit`. Every option is a toggle chip with a persistent selected state. Selecting a second price band keeps the first selected.

Ticket bands:

- Under $100 per person
- $100-$200 per person
- $200-$350 per person
- $350+ / worth the splurge

Food spend bands:

- Quick/casual under $30 per person
- Casual sit-down $30-$60 per person
- Nice dinner $60-$120 per person
- Splurge dinner $120+ per person

Gambling choices:

- No gambling
- Casino atmosphere only
- Light play under $100 total
- $100-$300 total
- $300-$750 total
- $750+ total
- Slots
- Table games
- Poker
- Sportsbook

`No gambling` and `Casino atmosphere only` are exclusive. Selecting either clears every paid bankroll and game-type selection. Selecting a paid bankroll or game type clears either exclusive choice. Paid bankroll bands and game types can otherwise be combined.

The top-level ticket-budget helpers and the refinement-step food and gambling groups use the same multi-select behavior. Existing single-choice groups such as lodging, group, pace, logistics, and vibe remain unchanged.

## Planner Semantics

No API or database schema changes are required. The existing string fields remain the transport format, but their values use explicit mix-aware sentences:

- `Mix ticket options across: Under $100 per person; $100-$200 per person. Include choices from each selected range when available.`
- `Mix meals across: Quick/casual under $30 per person; Splurge dinner $120+ per person.`
- `Gambling preferences: $100-$300 total; Table games; Sportsbook.`

The loading animation, trip summary, saved plan, and itinerary assumptions display these complete values rather than retaining only the first choice.

If a user selects no band, the corresponding field remains omitted. Tune actions such as Make Cheaper and More Premium continue to provide a single override string for that regeneration only.

## Recommendation Diversity

Ticket scoring recognizes each explicit selected price band. An event receives a budget-match boost when its available minimum price falls into any selected band. The planner's event alternatives are diversified by taking the strongest available event from each selected band before filling remaining alternatives by overall rank. The timed itinerary still uses availability, dates, group fit, location, and editorial quality; price bands do not override impossible schedules or missing inventory.

Restaurant scoring maps the selected meal bands to the existing `value`, `mid`, and `premium` levels. Restaurants matching any selected level receive the budget boost. Across multi-day plans, the existing ranked rotation can therefore include meals from more than one selected level.

Gambling bankroll selections guide schedule copy and casino inclusion but do not estimate gaming wins, losses, or guaranteed spend. `No gambling` continues to suppress casino blocks.

## Prompt Behavior

Ticket chips update one generated `Ticket budget:` sentence in the free-text prompt. Toggling chips rewrites that sentence with the full current selection. Removing the final ticket chip removes the generated sentence without altering user-authored text.

Food and gambling selections are added during the refinement step and do not rewrite unrelated prompt content.

## Accessibility

- Toggle buttons expose `aria-pressed`.
- Group copy states that multiple choices are allowed.
- Exclusive gambling behavior is deterministic and visible immediately.
- Selection is communicated by text/color and `aria-pressed`, not color alone.

## Verification

- E2E coverage selects two ticket ranges and confirms both remain active and reach the planner request.
- E2E coverage selects two food bands and confirms both reach the planner request.
- E2E coverage confirms gambling paid selections can coexist and that No Gambling clears them.
- Scoring tests verify matching events in each selected ticket band receive a boost and diversified alternatives cover available selected bands.
- Lint, production build, and the complete Playwright suite must pass.
