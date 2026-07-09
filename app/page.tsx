import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { HeroPlanner } from "@/components/HeroPlanner";
import { CategoryGrid } from "@/components/CategoryGrid";
import { EventCard } from "@/components/EventCard";
import { SectionHeader } from "@/components/SectionHeader";
import { bestForLinks, nearLinks } from "@/data/nav";
import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";

const topTonight = rankEvents(seedEvents).slice(0, 3);

export default function HomePage() {
  return (
    <>
      <HeroPlanner />

      <section className="px-4 py-10 sm:px-5 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader eyebrow="Tonight" title="Strong picks when the night is already moving." description="Skip the endless ticket scroll. These are high-confidence options when you need a show, laugh, view, game, or spectacle that still makes sense for tonight." />
            <p className="max-w-sm pb-4 text-sm font-bold leading-6 text-white/52 lg:pb-8 lg:text-right">
              Ranked for wow factor, value, group fit, location friction, and Vegas-only appeal.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {topTonight.map((event, index) => (
              <EventCard key={event.id} event={event} badge={["Best first click", "Most iconic", "Smart value"][index]} />
            ))}
          </div>
          <div className="mt-8 flex">
            <Link href="/tonight" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-center font-bold text-white transition hover:bg-white/10 sm:w-auto">
              See Tonight&apos;s Picks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-5 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Browse by lane" title="Choose the kind of night first." description="Each category is built for fast comparison, not endless inventory: production shows, comedy rooms, sports weekends, headline concerts, flexible attractions, and lower-budget wins." />
          <CategoryGrid />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-5 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 sm:p-7">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-amber-100">
              <Users className="h-5 w-5" />
            </div>
            <SectionHeader eyebrow="Best for" title="Start with who is going." description="First trip, date night, family, bachelor group, tight budget, or post-dinner plan: these pages turn intent into a manageable shortlist." />
            <div className="flex flex-wrap gap-3">
              {bestForLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/15 sm:text-base">{link.label}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 sm:p-7">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-amber-100">
              <MapPin className="h-5 w-5" />
            </div>
            <SectionHeader eyebrow="Near" title="Book around where you already are." description="Filter the night by Strip anchors, arenas, hotels, and venues so the plan feels easy before and after the main event." />
            <div className="flex flex-wrap gap-3">
              {nearLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/15 sm:text-base">{link.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 pb-16 sm:px-5 sm:py-12 sm:pb-20">
        <div className="mx-auto max-w-7xl rounded-lg border border-amber-100/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(217,70,239,0.12)_48%,rgba(255,255,255,0.06))] p-5 sm:p-8 md:p-10">
          <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-amber-100"><CalendarDays className="h-4 w-4" /> Trip-aware picks</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">Turn your dates into a saved Vegas game plan.</h2>
              <p className="mt-4 text-lg leading-8 text-white/70">Start with when you are going, then tune the plan by food, budget, lodging, group, and vibe. You will get a private return link after the itinerary builds.</p>
            </div>
            <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
              {["Pick travel dates", "Choose food, budget, lodging, and vibe", "Save the finished itinerary link"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm font-black text-white">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs text-black">{index + 1}</span>
                  {item}
                </div>
              ))}
              <Link href="#trip-builder" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-4 font-black text-black transition hover:bg-amber-100">
                Build My Experience <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
