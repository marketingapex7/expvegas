import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, Drama, MapPin, ShoppingBag, Sparkles, Ticket, Utensils, Users } from "lucide-react";
import { DirectorySection } from "@/components/DirectorySection";
import { EventCard } from "@/components/EventCard";
import { HeroPlanner } from "@/components/HeroPlanner";
import { HomeTripPreview } from "@/components/HomeTripPreview";
import { SectionHeader } from "@/components/SectionHeader";
import { bestForLinks, nearLinks } from "@/data/nav";
import { experienceListings, hotelListings, restaurantListings } from "@/lib/directory-data";
import { getLiveVegasEvents, getVegasToday } from "@/lib/live-events";

export const metadata = {
  title: { absolute: "ExperienceVegas | Build and Browse a Better Vegas Trip" },
  description: "Build a timed Las Vegas itinerary, then browse hotels, events, restaurants, attractions, and free experiences worth adding to your trip.",
  alternates: { canonical: "/" },
};

export const revalidate = 1800;

const browseLanes = [
  { href: "/las-vegas-hotels", label: "Hotels", Icon: Building2 },
  { href: "/las-vegas-shows", label: "Shows", Icon: Drama },
  { href: "/tonight", label: "Events", Icon: Ticket },
  { href: "/las-vegas-restaurants", label: "Restaurants", Icon: Utensils },
  { href: "/las-vegas-attractions", label: "Attractions", Icon: Sparkles },
  { href: "/las-vegas-shopping", label: "Shopping", Icon: ShoppingBag },
];

function selectListings(slugs: string[], source: typeof restaurantListings) {
  return slugs.map((slug) => source.find((listing) => listing.slug === slug)).filter((listing) => listing !== undefined);
}

export default async function HomePage() {
  const tonight = await getLiveVegasEvents(getVegasToday(), undefined, 12);
  const topTonight = tonight.events.slice(0, 3);
  const featuredRestaurants = selectListings(
    ["golden-steer-steakhouse", "best-friend", "bacchanal-buffet", "tacos-el-gordo"],
    restaurantListings,
  );
  const featuredExperiences = experienceListings.slice(0, 4);

  return (
    <>
      <HeroPlanner />
      <HomeTripPreview />

      <section className="border-y border-zinc-200 bg-white px-4 py-7 text-zinc-950 sm:px-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700">Browse Vegas</p>
              <h2 className="mt-1 text-xl font-black text-zinc-950">Find ideas first. Add the good ones to your itinerary.</h2>
            </div>
            <nav aria-label="Browse Vegas categories" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {browseLanes.map(({ href, label, Icon }) => (
                <Link key={href} href={href} className="flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-xs font-black text-zinc-600 transition hover:border-fuchsia-200 hover:bg-fuchsia-50 hover:text-zinc-950 sm:min-w-24">
                  <Icon className="h-5 w-5 text-fuchsia-700" />
                  <span className="max-w-full break-words">{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <DirectorySection
        eyebrow="Where to stay"
        title="Choose a hotel that makes the rest of the trip easier."
        description="The right base is about more than room rate. Compare the neighborhood, event access, group fit, and the experiences already on your list."
        listings={hotelListings.slice(0, 4)}
        viewAllHref="/las-vegas-hotels"
        viewAllLabel="Browse Hotels"
      />

      <section className="border-t border-zinc-200 bg-white px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              theme="light"
              eyebrow={tonight.isLive ? "Live tonight" : "Curated Vegas picks"}
              title={tonight.isLive ? "Events that are actually on tonight." : "Strong event picks while live inventory refreshes."}
              description={tonight.isLive
                ? "Compare the schedule, save interesting events to My Trip, or open the ticket provider only when you are ready to book."
                : "Ticketmaster inventory is temporarily unavailable, so these recommendations are clearly marked as curated rather than tonight's confirmed schedule."}
            />
            <Link href="/tonight" className="mb-8 inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-900 transition hover:bg-zinc-100 lg:self-auto">
              See Tonight&apos;s Schedule <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {topTonight.map((event, index) => <EventCard key={event.id} event={event} badge={["Top match", "High-energy pick", "Worth comparing"][index]} priority />)}
          </div>
        </div>
      </section>

      <DirectorySection
        eyebrow="Where to eat"
        title="Pick the meal that fits the night around it."
        description="Browse a useful mix of splurge dinners, group-friendly restaurants, buffets, and cheap eats. The planner will place them near the rest of your itinerary."
        listings={featuredRestaurants}
        viewAllHref="/las-vegas-restaurants"
        viewAllLabel="Browse Restaurants"
      />

      <DirectorySection
        eyebrow="Free and flexible"
        title="Leave room for Vegas that does not need a ticket."
        description="Shopping walks, fountains, resort interiors, and neighborhood wandering give the itinerary breathing room without turning every hour into another purchase."
        listings={featuredExperiences}
        viewAllHref="/free-things-to-do-las-vegas"
        viewAllLabel="Browse Free Things"
      />

      <section className="border-t border-zinc-200 bg-[#f7f7f8] px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <Users className="h-6 w-6 text-fuchsia-700" />
            <h2 className="mt-4 text-3xl font-black text-zinc-950">Browse by who is going.</h2>
            <p className="mt-3 max-w-xl leading-7 text-zinc-600">Start with the group when a category alone is not enough: couples, families, party weekends, first trips, and visitors who do not gamble.</p>
            <div className="mt-6 flex flex-wrap gap-2">{bestForLinks.map((link) => <Link key={link.href} href={link.href} className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950">{link.label}</Link>)}</div>
          </div>
          <div>
            <MapPin className="h-6 w-6 text-fuchsia-700" />
            <h2 className="mt-4 text-3xl font-black text-zinc-950">Browse near the night&apos;s anchor.</h2>
            <p className="mt-3 max-w-xl leading-7 text-zinc-600">Find dinner, drinks, attractions, and flexible stops around the resort, arena, or venue you already plan to visit.</p>
            <div className="mt-6 flex flex-wrap gap-2">{nearLinks.map((link) => <Link key={link.href} href={link.href} className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950">{link.label}</Link>)}</div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white px-4 py-10 pb-16 text-zinc-950 sm:px-5 sm:py-14 sm:pb-20">
        <div className="mx-auto max-w-7xl border-y border-zinc-200 py-8 sm:py-10">
          <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700"><CalendarDays className="h-4 w-4" /> Bring the shortlist together</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-zinc-950 md:text-4xl">Turn saved picks into a timed Vegas game plan.</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">Add places as you browse. The planner will use your dates, budget, lodging, travel time, and must-do selections to build the route.</p>
            </div>
            <Link href="/my-trip" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 font-black text-white transition hover:bg-fuchsia-800">
              Review My Itinerary <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
