"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, WalletCards } from "lucide-react";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { calculateTripBudget, formatCostRange } from "@/lib/trip-budget";

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export function HomeTripPreview() {
  const { items, dates, settings, hydrated } = useTripSelections();
  if (!hydrated || items.length === 0) return null;

  const budget = calculateTripBudget(items, settings, dates);
  const dateLabel =
    dates.arrivalDate && dates.departureDate
      ? `${formatDate(dates.arrivalDate)}-${formatDate(dates.departureDate)}`
      : "Dates not set";

  return (
    <section className="border-b border-zinc-200 bg-amber-50 px-4 py-5 text-zinc-950 sm:px-5" data-testid="returning-trip-preview">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-700">Continue your trip</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600"><CalendarDays className="h-3.5 w-3.5" /> {dateLabel}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600"><WalletCards className="h-3.5 w-3.5" /> {formatCostRange(budget.total)} estimated</span>
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap gap-2">
            {items.slice(0, 3).map((item) => <span key={item.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-black text-zinc-700"><MapPin className="h-3 w-3 shrink-0 text-fuchsia-700" /><span className="truncate">{item.name}</span></span>)}
            {items.length > 3 ? <span className="rounded-full px-2 py-1.5 text-xs font-black text-zinc-500">+{items.length - 3} more</span> : null}
          </div>
        </div>
        <Link href="/my-trip" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-fuchsia-800">Open My Itinerary <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}
