import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { EventGrid } from "@/components/EventGrid";
import { IntentPageContent } from "@/data/intent-pages";
import { VegasEvent } from "@/types/event";

export function IntentLandingPage({ eyebrow, content, events }: { eyebrow: string; content: IntentPageContent; events: VegasEvent[] }) {
  return (
    <section className="px-4 py-10 sm:px-5 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <header className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-fuchsia-200">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">{content.title}</h1>
          <p className="mt-5 text-lg leading-8 text-white/70">{content.intro}</p>
        </header>

        <div className="my-10 grid gap-4 md:grid-cols-3">
          {content.tips.map((tip) => (
            <div key={tip} className="flex gap-3 border-t border-white/15 py-4 text-sm font-bold leading-6 text-white/75">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-100" />
              <span>{tip}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-100">Curated starting points</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Compare the strongest fits</h2>
          </div>
        </div>
        <EventGrid events={events} />

        <div className="mt-10 flex flex-col gap-5 border-t border-white/15 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-amber-100"><Sparkles className="h-4 w-4" /> Make it trip-specific</p>
            <h2 className="mt-2 text-2xl font-black text-white">Turn these ideas into a timed itinerary.</h2>
          </div>
          <Link href="/#trip-builder" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-black text-black transition hover:bg-amber-100">
            Build My Experience <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
