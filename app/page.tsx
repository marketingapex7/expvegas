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

      <section className="px-5 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader eyebrow="Tonight" title="Need inspiration before building a plan?" description="Start with a few strong picks across shows, comedy, attractions, and sports, then use the trip finder to shape the night around your group." />
            <p className="max-w-sm pb-8 text-sm font-bold leading-6 text-white/50 lg:text-right">
              Ranked for wow factor, value, group fit, and Vegas-only appeal.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {topTonight.map((event, index) => (
              <EventCard key={event.id} event={event} badge={["Best Overall", "Best Wow Factor", "Best Value"][index]} />
            ))}
          </div>
          <div className="mt-8 flex">
            <Link href="/tonight" className="w-full rounded-full border border-white/15 px-5 py-3 text-center font-bold text-white transition hover:bg-white/10 sm:w-auto">See Tonight&apos;s Picks</Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Browse" title="Prefer to explore manually?" description="Each category stays available for visitors who already know the lane they want: big production, easy laughs, arena energy, headline concerts, or flexible attractions." />
          <CategoryGrid />
        </div>
      </section>

      <section className="px-5 py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-7">
            <SectionHeader eyebrow="Best For" title="Match the occasion, then show the tickets" description="These pages turn high-intent searches into practical shortlists for first-timers, couples, families, groups, and budget-conscious visitors." />
            <div className="flex flex-wrap gap-3">
              {bestForLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/15 sm:text-base">{link.label}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-7">
            <SectionHeader eyebrow="Near" title="Help visitors book around where they already are" description="Location pages make it easy to find worthwhile plans near major hotels, venues, arenas, and Strip anchors without restarting the search." />
            <div className="flex flex-wrap gap-3">
              {nearLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/15 sm:text-base">{link.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 pb-16 sm:py-12 sm:pb-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-fuchsia-300/20 bg-[linear-gradient(135deg,rgba(217,70,239,0.16),rgba(255,255,255,0.06))] p-6 sm:p-8 md:p-10">
          <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-100">Get Vegas picks</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">Save the plan before the trip gets expensive.</h2>
              <p className="mt-4 text-lg leading-8 text-white/70">Capture the visitor&apos;s email and travel window when intent is highest. The same flow can later power saved itineraries, weekend picks, deal alerts, and personalized follow-ups.</p>
            </div>
            <form className="grid gap-3">
              <input type="email" placeholder="Email address" className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-fuchsia-100/70" />
              <input placeholder="Travel dates or weekend" className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-fuchsia-100/70" />
              <button className="min-h-12 rounded-2xl bg-white px-5 py-4 font-black text-black transition hover:bg-fuchsia-100">Send My Vegas Plan</button>
              <p className="text-center text-xs font-bold text-white/45">Itineraries first. Deals and alerts later.</p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
