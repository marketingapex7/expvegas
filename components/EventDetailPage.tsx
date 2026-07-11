import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, Ticket } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { buildEventStructuredData } from "@/lib/event-seo";
import { formatPrice } from "@/lib/utils";
import { VegasEvent } from "@/types/event";

function eventSchedule(event: VegasEvent) {
  if (!event.localDate) return null;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(event.localTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(`${event.localDate}T${event.localTime || "12:00:00"}`));
}

export function EventDetailPage({ event, similar, path }: { event: VegasEvent; similar: VegasEvent[]; path: string }) {
  const hasTicketUrl = Boolean(event.affiliateUrl && event.affiliateUrl !== "#");
  const schedule = eventSchedule(event);
  const structuredData = buildEventStructuredData(event, path);

  return (
    <section className="px-4 py-10 sm:px-5 sm:py-16">
      {structuredData ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      ) : null}
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="rounded-lg border border-white/10 bg-white/[0.06] p-5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">{event.subcategory || event.category}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">{event.name}</h1>
          <p className="mt-5 text-lg leading-8 text-white/70 sm:text-xl sm:leading-9">{event.quickVerdict}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-white/80">
              <MapPin className="h-4 w-4 shrink-0 text-amber-100" />
              <span className="min-w-0">{event.venueName} - {event.area}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-white/80">
              <Ticket className="h-4 w-4 shrink-0 text-amber-100" />
              <span>{formatPrice(event.priceMin)}</span>
            </div>
            {schedule ? (
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-white/80 sm:col-span-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-amber-100" />
                <span>{schedule}</span>
              </div>
            ) : null}
            {event.runtimeMinutes ? (
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-white/80">
                <Clock className="h-4 w-4 shrink-0 text-amber-100" />
                <span>{event.runtimeMinutes} minutes</span>
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="font-black text-white">Best for</h2>
              <ul className="mt-3 space-y-2 text-white/70">{event.bestFor.map((item) => <li key={item}>- {item}</li>)}</ul>
            </div>
            <div>
              <h2 className="font-black text-white">Think twice if</h2>
              <ul className="mt-3 space-y-2 text-white/70">{event.skipIf.map((item) => <li key={item}>- {item}</li>)}</ul>
            </div>
          </div>

          {hasTicketUrl ? (
            <a href={event.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 font-black text-black transition hover:bg-amber-100 sm:w-auto">
              Check Tickets <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <Link href="/#trip-builder" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 font-black text-black transition hover:bg-amber-100 sm:w-auto">
              Build Around This Pick <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <p className="mt-3 text-xs leading-5 text-white/45">Prices and availability can change. Confirm the final total and event time before booking.</p>
        </article>

        <aside>
          <h2 className="mb-4 text-2xl font-black text-white">Similar picks</h2>
          <div className="grid gap-5">{similar.map((item) => <EventCard key={item.id} event={item} />)}</div>
        </aside>
      </div>
    </section>
  );
}
