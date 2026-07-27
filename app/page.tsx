import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { HomeLivePlan } from "@/components/HomeLivePlan";
import { HomeTripPreview } from "@/components/HomeTripPreview";
import { HomeWorthRail } from "@/components/HomeWorthRail";
import { SectionHeader } from "@/components/SectionHeader";
import { bestForLinks, nearLinks } from "@/data/nav";
import { experienceListings, hotelListings, restaurantListings } from "@/lib/directory-data";
import { getHomepageEventShelf, getVegasToday, getVegasWeekend } from "@/lib/live-events";
import { generatePlannerResponse } from "@/lib/planner-service";

export const metadata = {
  title: { absolute: "ExperienceVegas | Personalized Las Vegas Trip Planner" },
  description: "See a timed Las Vegas itinerary immediately, then refine the dates, group size, budget, meals, events, and flexible stops that fit your trip.",
  alternates: { canonical: "/" },
};

export const revalidate = 1800;

const discoveryLinks = [
  bestForLinks.find((link) => link.label === "First-timers"),
  bestForLinks.find((link) => link.label === "Couples"),
  bestForLinks.find((link) => link.label === "Families"),
  nearLinks.find((link) => link.label === "Sphere"),
  nearLinks.find((link) => link.label === "Bellagio"),
  nearLinks.find((link) => link.label === "T-Mobile Arena"),
].filter((link) => link !== undefined);

export default async function HomePage() {
  const weekend = getVegasWeekend();
  const defaultControls = {
    arrivalDate: weekend.startDate,
    departureDate: weekend.endDate,
    partySize: 2,
    budget: "mid" as const,
  };
  const defaultInput = {
    travelDates: `${weekend.startDate} to ${weekend.endDate}`,
    partySize: 2,
    budget: "event tickets from $100-$200 per person",
    groupType: "two travelers",
    stayingNear: "center Strip",
    vibe: "classic Vegas with one strong anchor, a useful meal, a free stop, and easy logistics",
    mealBudget: "$30-$60 per person",
    pace: "Balanced",
    logistics: "Keep it walkable",
    prompt: "Build a geographically coherent Vegas trip with realistic timing and no unnecessary backtracking.",
  };

  const [defaultPlan, eventShelf] = await Promise.all([
    generatePlannerResponse(defaultInput),
    getHomepageEventShelf(),
  ]);

  const worthAdding = [
    ...hotelListings.slice(0, 2),
    ...restaurantListings.slice(0, 2),
    ...experienceListings.slice(0, 2),
  ];
  const shelfHref = eventShelf.tier === "weekend"
    ? "/this-weekend"
    : eventShelf.tier === "resident"
      ? "/las-vegas-shows"
      : "/tonight";

  return (
    <>
      <HomeLivePlan initialResult={defaultPlan} initialControls={defaultControls} minDate={getVegasToday()} />
      <HomeTripPreview />

      <section className="border-y border-zinc-200 bg-white px-4 py-4 text-zinc-950 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs font-bold leading-5 text-zinc-600 sm:text-sm">
          <span>{eventShelf.isLive ? "Live schedules from Ticketmaster" : "Curated schedule from ExperienceVegas"}</span>
          <span aria-hidden="true" className="text-zinc-300">/</span>
          <span>Prices are planning estimates, not quotes</span>
          <span aria-hidden="true" className="text-zinc-300">/</span>
          <span>No booking required; providers handle checkout</span>
        </div>
      </section>

      <section data-testid="home-events" className="bg-white px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              theme="light"
              eyebrow={eventShelf.eyebrow}
              title={eventShelf.title}
              description={eventShelf.description}
            />
            <div className="mb-8 flex flex-wrap items-center gap-3 lg:mb-0">
              <span className="text-xs font-bold text-zinc-400">{eventShelf.updatedLabel}</span>
              <Link href={shelfHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-900 transition hover:bg-zinc-100">
                Full schedule <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid snap-x snap-mandatory auto-cols-[84%] grid-flow-col items-start gap-5 overflow-x-auto pb-3 sm:auto-cols-[46%] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible">
            {eventShelf.events.slice(0, 6).map((event, index) => (
              <EventCard key={event.id} event={event} priority={index < 3} showImage={eventShelf.isLive} analyticsContext="homepage_event_shelf" />
            ))}
          </div>
        </div>
      </section>

      <HomeWorthRail listings={worthAdding} />

      <section className="border-t border-zinc-200 bg-white px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700">Start with what matters</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">Plan by group or by the place anchoring your night.</h2>
            <div className="flex max-w-2xl flex-wrap gap-2">
              {discoveryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:border-fuchsia-200 hover:bg-fuchsia-50 hover:text-zinc-950">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
