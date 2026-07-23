"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { CardImage } from "@/components/CardImage";
import { VegasEvent } from "@/types/event";
import { formatPrice } from "@/lib/utils";
import { TripToggleButton } from "@/components/TripToggleButton";

const scheduleDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const scheduleDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const showtimeDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const showtimeDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatShowtime(localDate: string, localTime?: string, concise = false) {
  const date = new Date(`${localDate}T${localTime || "12:00:00"}`);
  if (concise) return (localTime ? showtimeDateTimeFormatter : showtimeDateFormatter).format(date);
  return (localTime ? scheduleDateTimeFormatter : scheduleDateFormatter).format(date);
}

export function EventCard({ event, badge, priority = false }: { event: VegasEvent; badge?: string; priority?: boolean }) {
  const showtimes = useMemo(() => event.showtimes?.length ? event.showtimes : [{ id: event.id, localDate: event.localDate, localTime: event.localTime, startDateTime: event.startDateTime, affiliateUrl: event.affiliateUrl }], [event]);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState(showtimes[0].id);
  const selectedShowtime = showtimes.find((showtime) => showtime.id === selectedShowtimeId) || showtimes[0];
  const ticketmasterId = selectedShowtime.id.startsWith("ticketmaster-") ? selectedShowtime.id.slice("ticketmaster-".length) : null;
  const eventPath = ticketmasterId ? `/events/${ticketmasterId}` : `/${event.category}/${event.slug}`;
  const ticketUrl = selectedShowtime.affiliateUrl || event.affiliateUrl;
  const hasTicketUrl = Boolean(ticketUrl && ticketUrl !== "#");
  const taxonomyLabel = event.subcategory && !["undefined", "unknown"].includes(event.subcategory.toLowerCase()) ? event.subcategory : event.category;
  const imageUrl = event.imageUrl || "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1200&q=82";
  const schedule = selectedShowtime.localDate
    ? formatShowtime(selectedShowtime.localDate, selectedShowtime.localTime)
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
    <article className="group flex min-h-full flex-col overflow-hidden rounded-lg border border-zinc-200/90 bg-white p-2 shadow-[0_8px_30px_rgba(24,24,27,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(24,24,27,0.14)]">
      <Link href={eventPath} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-zinc-100">
          <CardImage
            src={imageUrl}
            alt={`${event.name} at ${event.venueName}`}
            category="event"
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-zinc-950 shadow-sm backdrop-blur">
            {badge || taxonomyLabel}
          </span>
          <span className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur ${ticketmasterId ? "bg-emerald-900/90 text-white" : "bg-zinc-950/80 text-white"}`}>
            {ticketmasterId ? "Live schedule" : "Editorial pick"}
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
        <Link href={eventPath} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600">
          <h3 className="text-2xl font-black leading-[1.08] text-zinc-950 transition group-hover:text-fuchsia-800">{event.name}</h3>
        </Link>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-700">
          {schedule ? <span className="rounded-full bg-zinc-100 px-3 py-1.5">{schedule}</span> : null}
          <span className="max-w-full truncate rounded-full bg-zinc-100 px-3 py-1.5">{event.venueName}</span>
          <span title="Starting price; taxes and fees may be added by the ticket provider" className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-900">{formatPrice(event.priceMin)}</span>
          {event.ageRestriction ? <span className="rounded-full bg-zinc-100 px-3 py-1.5">{event.ageRestriction}</span> : null}
        </div>
        {showtimes.length > 1 ? (
          <label className="mt-4 grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
            Choose a time
            <select value={selectedShowtimeId} onChange={(event) => setSelectedShowtimeId(event.target.value)} className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-900 outline-none focus:border-fuchsia-600">
              {showtimes.map((showtime) => {
                const value = showtime.localDate ? formatShowtime(showtime.localDate, showtime.localTime, true) : "Time to be confirmed";
                return <option key={showtime.id} value={showtime.id}>{value}</option>;
              })}
            </select>
          </label>
        ) : null}
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-700">{event.quickVerdict}</p>
        <div className="mt-auto grid gap-2 pt-6">
          {hasTicketUrl ? (
            <a href={ticketUrl} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 px-4 py-3 text-sm font-black text-zinc-950 shadow-sm transition hover:from-amber-200 hover:to-amber-300">
              <Ticket className="h-3.5 w-3.5" /> Check Tickets
            </a>
          ) : (
            <Link href={eventPath} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 px-4 py-3 text-sm font-black text-zinc-950 shadow-sm transition hover:from-amber-200 hover:to-amber-300">
              <Ticket className="h-3.5 w-3.5" /> View Booking Notes
            </Link>
          )}
          <TripToggleButton item={tripPick} theme="light" variant="bare" />
          <p className="text-center text-[11px] font-semibold leading-4 text-zinc-400">
            {ticketmasterId ? "Live schedule | starting price may exclude fees" : "Editorial pick | confirm schedule and price"}
          </p>
        </div>
      </div>
    </article>
  );
}
