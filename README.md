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

## Next build priorities

1. Polish homepage design and copy.
2. Replace seed data with Supabase events.
3. Add Ticketmaster Discovery API sync for concerts, sports, comedy, and major events.
4. Add Viator/GetYourGuide for attractions and tours.
5. Upgrade planner output with LLM-generated explanations grounded only in real inventory.
6. Add affiliate click tracking and email capture.
