import Link from "next/link";
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

      <section className="px-5 py-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Tonight" title="Best picks for a Vegas night that does not waste your time" description="Start with a curated set of shows, comedy, attractions, and sports picks. As APIs are added, this section becomes real-time." />
          <div className="grid gap-6 md:grid-cols-3">
            {topTonight.map((event, index) => (
              <EventCard key={event.id} event={event} badge={["Best Overall", "Best Wow Factor", "Best Value"][index]} />
            ))}
          </div>
          <div className="mt-8">
            <Link href="/tonight" className="rounded-full border border-white/15 px-5 py-3 font-bold text-white transition hover:bg-white/10">See Tonight&apos;s Picks</Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Browse" title="Find the right type of Vegas experience" description="The site starts as a curated guide, then becomes smarter as Ticketmaster, Viator, and internal scoring come online." />
          <CategoryGrid />
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7">
            <SectionHeader eyebrow="Best For" title="Pages built around the trip, not the ticket category" />
            <div className="flex flex-wrap gap-3">
              {bestForLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full bg-white/10 px-4 py-2 font-bold text-white/80 hover:bg-white/15">{link.label}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7">
            <SectionHeader eyebrow="Near" title="Win long-tail searches near hotels and venues" />
            <div className="flex flex-wrap gap-3">
              {nearLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full bg-white/10 px-4 py-2 font-bold text-white/80 hover:bg-white/15">{link.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-fuchsia-300/20 bg-fuchsia-300/10 p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_0.9fr] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-100">Get Vegas picks</p>
              <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Build a list before the trip starts.</h2>
              <p className="mt-4 text-lg leading-8 text-white/70">Capture email, travel dates, budget, and group type. Later this becomes SMS/email deal alerts and weekly weekend picks.</p>
            </div>
            <form className="grid gap-3">
              <input placeholder="Email address" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35" />
              <input placeholder="Travel dates" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35" />
              <button className="rounded-2xl bg-white px-5 py-4 font-black text-black">Send Me Picks</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
