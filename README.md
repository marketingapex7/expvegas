# ExperienceVegas

A curated Vegas shows, comedy, sports, concerts, attractions, and trip-planning site.

## Product direction

ExperienceVegas is not a generic ticket catalog. It helps visitors answer: **what should I actually book in Vegas?**

The MVP includes:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Static seed event data
- Homepage trip finder positioning
- Planner page and API stub
- Category pages
- Event detail pages
- Buyer-intent pages for tonight, this weekend, cheap things to do, best-for pages, and near pages
- Supabase schema for the next database phase

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Rate limiting

API routes share their rate-limit counters through Upstash Redis when
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. Create a free
database at [console.upstash.com](https://console.upstash.com), copy its REST URL
and token, and add both to the deployment environment.

Without those variables the limiter counts in memory instead. That is accurate
locally and in CI, where a single process handles every request, but on
serverless each instance keeps its own counters, so the effective limit is
multiplied by the number of warm instances. Production logs a warning once per
instance when it falls back, so the gap is visible rather than silent.

## Tests

```bash
npm test          # unit suite (Vitest) - planning, scoring, normalization
npm run test:watch
npm run test:e2e  # browser suite (Playwright), boots a dev server
```

`tests/unit` holds the pure-logic specs and finishes in about a second, so it is
the one to run while iterating on the itinerary engine. `e2e` is reserved for
tests that genuinely need a browser. Both run in CI along with `npm run lint`
and `npm run typecheck`.

## Next build priorities

1. Polish homepage design and copy.
2. Replace seed data with Supabase events.
3. Add Ticketmaster Discovery API sync for concerts, sports, comedy, and major events.
4. Add Viator/GetYourGuide for attractions and tours.
5. Upgrade planner output with LLM-generated explanations grounded only in real inventory.
6. Add affiliate click tracking and email capture.
