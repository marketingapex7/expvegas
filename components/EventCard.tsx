import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { VegasEvent } from "@/types/event";
import { formatPrice } from "@/lib/utils";
import { TripToggleButton } from "@/components/TripToggleButton";

export function EventCard({ event, badge }: { event: VegasEvent; badge?: string }) {
  const ticketmasterId = event.id.startsWith("ticketmaster-") ? event.id.slice("ticketmaster-".length) : null;
  const eventPath = ticketmasterId ? `/events/${ticketmasterId}` : `/${event.category}/${event.slug}`;
  const hasTicketUrl = Boolean(event.affiliateUrl && event.affiliateUrl !== "#");
  const imageUrl = event.imageUrl || "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1200&q=82";
  const schedule = event.localDate
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        ...(event.localTime ? { hour: "numeric", minute: "2-digit" } : {}),
      }).format(new Date(`${event.localDate}T${event.localTime || "12:00:00"}`))
    : null;
  const tripPick = {
    id: event.id,
    slug: event.slug,
    name: event.name,
    category: "event" as const,
    area: event.area,
    description: event.quickVerdict,
    imageUrl,
    priceLabel: formatPrice(event.priceMin),
    durationLabel: event.runtimeMinutes ? `${event.runtimeMinutes} minutes` : "Confirm runtime",
    estimatedCostMin: event.priceMin,
    estimatedCostMax: event.priceMax || event.priceMin,
    costUnit: "per-person" as const,
    bookingGuidance: hasTicketUrl ? "book-now" as const : "check-availability" as const,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, Las Vegas, NV`)}`,
    detailUrl: eventPath,
  };

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg">
      <div className="relative flex min-h-48 items-end justify-between overflow-hidden bg-zinc-900 p-5">
        <Image
          src={imageUrl}
          alt={`${event.name} at ${event.venueName}`}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08070b] via-[#08070b]/45 to-transparent" />
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2">
            {badge ? <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white">{badge}</span> : null}
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white/75">{ticketmasterId ? "Live schedule" : "Curated pick"}</span>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/55">{event.subcategory || event.category}</p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">{event.name}</h3>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">{event.venueName}</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">{formatPrice(event.priceMin)}</span>
          {schedule ? <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">{schedule}</span> : null}
          {event.ageRestriction ? <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">{event.ageRestriction}</span> : null}
        </div>
        <p className="text-sm leading-6 text-zinc-600">{event.quickVerdict}</p>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-700">Best for</p>
          <p className="mt-1 text-sm text-zinc-600">{event.bestFor.slice(0, 3).join(" / ")}</p>
        </div>
        <TripToggleButton item={tripPick} theme="light" />
        <div className="grid gap-3 pt-2 sm:grid-cols-[auto_1fr]">
          <Link href={eventPath} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100">
            Details <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {hasTicketUrl ? (
            <a href={event.affiliateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-black text-black transition hover:bg-amber-200">
              <Ticket className="h-3.5 w-3.5" /> Check Tickets
            </a>
          ) : (
            <Link href={eventPath} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-black text-black transition hover:bg-amber-200">
              <Ticket className="h-3.5 w-3.5" /> View Booking Notes
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
