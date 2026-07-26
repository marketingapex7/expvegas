"use client";

import { ExternalLink, Ticket, X } from "lucide-react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ItineraryDay } from "@/types/planner";
import { goCityAffiliateLinks } from "@/lib/go-city";

type PlanBookingChecklistProps = {
  planId: string;
  itineraryDays: ItineraryDay[];
  estimatedSpend?: string;
};

type BookingItem = {
  key: string;
  dayLabel: string;
  time: string;
  title: string;
  location?: string;
  priceHint?: string;
  category: "event" | "meal" | "pass";
  url: string;
  direct: boolean;
  includedTitles?: string[];
};

function isDirectBookingUrl(url?: string) {
  return Boolean(url && url !== "#");
}

function fallbackBookingUrl(title: string, location?: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${location || "Las Vegas"}`)}`;
}

function bookingAction(item: BookingItem) {
  if (!item.direct) return "Find booking";
  if (item.category === "event") return "Tickets";
  if (item.category === "pass") return "Pass";
  return "Reserve";
}

function BookingItems({
  items,
  bookedItems,
  onToggle,
  compact = false,
}: {
  items: BookingItem[];
  bookedItems: Record<string, boolean>;
  onToggle: (key: string) => void;
  compact?: boolean;
}) {
  if (!items.length) {
    return <p className="mt-4 text-sm leading-6 text-white/65">Nothing in this plan requires advance booking yet.</p>;
  }

  return (
    <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
      {items.map((item, index) => {
        const checked = Boolean(bookedItems[item.key]);
        return (
          <div key={item.key} className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-2 py-3 ${compact ? "items-center" : "items-start"}`}>
            <label className="mt-0.5 inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={checked} onChange={() => onToggle(item.key)} aria-label={`${item.title} booked`} className="h-4 w-4 accent-amber-300" />
              <span className="sr-only">{checked ? "Booked" : "Mark booked"}</span>
            </label>
            <div className="min-w-0">
              <p className={`text-sm font-black text-white ${checked ? "line-through opacity-55" : ""}`}>{item.title}</p>
              <p className="mt-1 text-xs font-bold text-white/45">{item.dayLabel} / {item.time}</p>
              {!compact && item.location ? <p className="mt-1 text-xs text-white/45">{item.location}</p> : null}
              {!compact && item.includedTitles?.length ? <p className="mt-2 text-xs leading-5 text-white/55">{item.includedTitles.join(" / ")}</p> : null}
            </div>
            <a href={item.url} target="_blank" rel={item.category === "pass" ? "noopener noreferrer sponsored" : "noopener noreferrer"} className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md px-2 text-xs font-black text-amber-200 hover:bg-white/10">
              {item.direct ? <Ticket className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
              {bookingAction(item)}
            </a>
            <span className="sr-only">Item {index + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PlanBookingChecklist({ planId, itineraryDays, estimatedSpend }: PlanBookingChecklistProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const storageKey = `experiencevegas:booked:${planId}`;
  const subscribe = useCallback((onStoreChange: () => void) => {
    function handleStorage(event: StorageEvent) {
      if (event.key === storageKey) onStoreChange();
    }
    function handleLocalChange() {
      onStoreChange();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("experiencevegas-booking-change", handleLocalChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("experiencevegas-booking-change", handleLocalChange);
    };
  }, [storageKey]);
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) || "{}";
    } catch {
      return "{}";
    }
  }, [storageKey]);
  const storedBookings = useSyncExternalStore(subscribe, getSnapshot, () => "{}");
  const bookedItems = useMemo(() => {
    try {
      return JSON.parse(storedBookings) as Record<string, boolean>;
    } catch {
      return {};
    }
  }, [storedBookings]);

  const bookingItems = useMemo(() => {
    const standardItems = itineraryDays.flatMap((day) =>
      day.blocks.flatMap((block, index): BookingItem[] => {
        if (block.category !== "event" && block.category !== "meal") return [];

        const direct = isDirectBookingUrl(block.bookingUrl);
        return [{
          key: `${planId}-${day.date}-${index}-${block.title}`,
          dayLabel: day.label,
          time: block.time,
          title: block.title,
          location: block.location,
          priceHint: block.priceHint,
          category: block.category,
          url: direct ? block.bookingUrl! : fallbackBookingUrl(block.title, block.location),
          direct,
        }];
      }),
    );
    const goCityBlocks = itineraryDays.flatMap((day) =>
      day.blocks.filter((block) => block.provider === "go-city"),
    );

    if (goCityBlocks.length === 0) return standardItems;

    const passItem: BookingItem = {
      key: `${planId}-go-city-pass`,
      dayLabel: "Trip pass",
      time: "One purchase",
      title: `Go City for ${goCityBlocks.length} included ${goCityBlocks.length === 1 ? "attraction" : "attractions"}`,
      priceHint: "Compare pass price with individual admission",
      category: "pass",
      url: goCityAffiliateLinks.overview,
      direct: true,
      includedTitles: goCityBlocks.map((block) => block.title),
    };

    return [passItem, ...standardItems];
  }, [itineraryDays, planId]);

  const bookedCount = bookingItems.filter((item) => bookedItems[item.key]).length;
  const remainingCount = Math.max(0, bookingItems.length - bookedCount);

  function toggleBooked(itemKey: string) {
    const next = { ...bookedItems, [itemKey]: !bookedItems[itemKey] };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event("experiencevegas-booking-change"));
    } catch {
      // The booking actions remain usable when storage is unavailable.
    }
  }

  return (
    <section data-testid="plan-booking-checklist">
      <div className="hidden rounded-lg bg-zinc-950 p-5 text-white shadow-lg lg:block">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Book this trip</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h3 className="text-2xl font-black">{remainingCount ? `${remainingCount} ${remainingCount === 1 ? "item" : "items"} need action` : "Booking complete"}</h3>
          <span className="shrink-0 text-xs font-black text-amber-200">{bookedCount}/{bookingItems.length}</span>
        </div>
        {bookingItems.length ? (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-amber-300 transition-all" style={{ width: `${Math.round((bookedCount / bookingItems.length) * 100)}%` }} />
          </div>
        ) : null}
        <BookingItems items={bookingItems} bookedItems={bookedItems} onToggle={toggleBooked} compact />
        {estimatedSpend ? <p className="mt-4 text-xs leading-5 text-white/55">Working estimate: {estimatedSpend}</p> : null}
        <p className="mt-3 text-xs leading-5 text-white/45">Nothing is marked booked until you confirm it.</p>
      </div>

      <div data-testid="mobile-booking-bar" className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-white/10 bg-zinc-950 px-4 py-3 text-white shadow-[0_-8px_24px_rgba(0,0,0,0.28)] lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{remainingCount ? `${remainingCount} ${remainingCount === 1 ? "item" : "items"} to book` : "Booking complete"}</p>
          {estimatedSpend ? <p className="truncate text-xs text-white/55">{estimatedSpend}</p> : null}
        </div>
        <button type="button" onClick={() => setMobileOpen(true)} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-amber-300 px-4 text-sm font-black text-zinc-950">
          Review
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end lg:hidden">
          <button type="button" aria-label="Close booking checklist" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/65" />
          <div role="dialog" aria-modal="true" aria-label="Booking checklist" className="relative z-10 max-h-[82vh] w-full overflow-y-auto rounded-t-lg bg-zinc-950 p-5 pb-8 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Book this trip</p>
                <h3 className="mt-1 text-2xl font-black">{remainingCount ? `${remainingCount} ${remainingCount === 1 ? "item" : "items"} need action` : "Booking complete"}</h3>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close booking checklist" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>
            <BookingItems items={bookingItems} bookedItems={bookedItems} onToggle={toggleBooked} />
            <button type="button" onClick={() => setMobileOpen(false)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-amber-300 px-4 text-sm font-black text-zinc-950">
              Back to itinerary
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
