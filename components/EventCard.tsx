import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { VegasEvent } from "@/types/event";
import { formatPrice } from "@/lib/utils";

export function EventCard({ event, badge }: { event: VegasEvent; badge?: string }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-amber-100/25 hover:bg-white/[0.09]">
      <div className="flex min-h-36 items-start justify-between bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(217,70,239,0.16)_48%,rgba(14,165,233,0.1))] p-5">
        <div>
          {badge ? <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white">{badge}</span> : null}
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/55">{event.subcategory || event.category}</p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">{event.name}</h3>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">{event.venueName}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">{formatPrice(event.priceMin)}</span>
          {event.ageRestriction ? <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">{event.ageRestriction}</span> : null}
        </div>
        <p className="text-sm leading-6 text-white/72">{event.quickVerdict}</p>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100">Best for</p>
          <p className="mt-1 text-sm text-white/70">{event.bestFor.slice(0, 3).join(" / ")}</p>
        </div>
        <div className="grid gap-3 pt-2 sm:grid-cols-[auto_1fr]">
          <Link href={`/${event.category}/${event.slug}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
            Details <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <a href={event.affiliateUrl} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-amber-100">
            <Ticket className="h-3.5 w-3.5" /> Check Tickets
          </a>
        </div>
      </div>
    </article>
  );
}
