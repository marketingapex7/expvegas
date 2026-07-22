"use client";

import { Check, ExternalLink, Ticket } from "lucide-react";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { ItineraryDay } from "@/types/planner";

type PlanBookingChecklistProps = {
  planId: string;
  itineraryDays: ItineraryDay[];
};

type BookingItem = {
  key: string;
  dayLabel: string;
  time: string;
  title: string;
  location?: string;
  priceHint?: string;
  category: "event" | "meal";
  url: string;
  direct: boolean;
};

function isDirectBookingUrl(url?: string) {
  return Boolean(url && url !== "#");
}

function fallbackBookingUrl(title: string, location?: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${location || "Las Vegas"}`)}`;
}

export function PlanBookingChecklist({ planId, itineraryDays }: PlanBookingChecklistProps) {
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

  const bookingItems = useMemo(
    () =>
      itineraryDays.flatMap((day) =>
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
      ),
    [itineraryDays, planId],
  );

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
    <section data-testid="plan-booking-checklist" className="mt-5 rounded-lg border border-amber-200/30 bg-black/30 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">Lock in the anchors</p>
          <h3 className="mt-1 text-xl font-black text-white">Book now</h3>
          <p className="mt-1 text-sm leading-6 text-white/60">Tickets and tables worth handling before the trip.</p>
        </div>
        {bookingItems.length ? (
          <span className="shrink-0 rounded-full bg-amber-200 px-2.5 py-1 text-xs font-black text-black">
            {bookingItems.length}
          </span>
        ) : null}
      </div>

      {bookingItems.length ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {bookingItems.map((item) => {
            const checked = Boolean(bookedItems[item.key]);
            const action = item.direct
              ? item.category === "event" ? "Check Tickets" : "Reserve Table"
              : "Find Booking";

            return (
              <div key={item.key} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-100">{item.dayLabel} · {item.time}</p>
                  <p className={`mt-1 font-black text-white ${checked ? "line-through opacity-55" : ""}`}>{item.title}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-white/50">
                    {item.location ? <span>{item.location}</span> : null}
                    {item.priceHint ? <span className="text-white/75">{item.priceHint}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 text-xs font-black text-white/75 hover:bg-white/10">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBooked(item.key)}
                      aria-label={`${item.title} booked`}
                      className="h-4 w-4 accent-amber-200"
                    />
                    {checked ? <Check className="h-3.5 w-3.5" /> : null}
                    Booked
                  </label>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-200 px-3 text-xs font-black text-black transition hover:bg-amber-100 sm:flex-none"
                  >
                    {item.direct ? <Ticket className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                    {action}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-white/[0.06] p-3 text-sm text-white/65">Nothing in this plan requires advance booking yet.</p>
      )}
    </section>
  );
}
