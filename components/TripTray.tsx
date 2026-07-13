"use client";

import Link from "next/link";
import { CalendarPlus, ChevronRight, MapPin, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTripSelections } from "@/components/TripSelectionProvider";

const categoryLabels = {
  hotel: "Stay",
  restaurant: "Eat",
  event: "Event",
  attraction: "Do",
  free: "Free",
  shopping: "Explore",
};

export function TripTray() {
  const { items, hydrated, removeItem, clearItems } = useTripSelections();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  if (!hydrated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 right-4 z-40 flex min-h-14 items-center justify-between rounded-lg border border-amber-100/25 bg-amber-200 px-4 py-3 text-left text-black shadow-2xl shadow-black/40 md:bottom-6 md:left-auto md:right-6 md:w-72"
        aria-label={`Open My Trip with ${items.length} selections`}
      >
        <span>
          <span className="block text-xs font-black uppercase tracking-[0.16em]">My Trip</span>
          <span className="block text-sm font-bold">{items.length ? `${items.length} pick${items.length === 1 ? "" : "s"} saved` : "Start adding places"}</span>
        </span>
        <ChevronRight className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/65" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setOpen(false);
        }}>
          <aside role="dialog" aria-modal="true" aria-label="My Trip selections" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0d0b12] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Build as you browse</p>
                <h2 className="mt-1 text-2xl font-black text-white">My Trip <span className="text-white/45">({items.length})</span></h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close My Trip" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {items.length ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">{categoryLabels[item.category]}</p>
                          <Link href={item.detailUrl} onClick={() => setOpen(false)} className="mt-1 block text-lg font-black text-white hover:text-amber-100">{item.name}</Link>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/55"><MapPin className="h-3.5 w-3.5" /> {item.area}</p>
                        </div>
                        <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={clearItems} className="px-2 py-2 text-sm font-bold text-white/55 hover:text-white">Clear all selections</button>
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <CalendarPlus className="h-8 w-8 text-amber-100" />
                  <h3 className="mt-4 text-xl font-black text-white">Your trip tray is empty</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/60">Add hotels, restaurants, events, and flexible stops as you browse. We will use them when the itinerary builds.</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <Link href="/#trip-builder" onClick={() => setOpen(false)} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 font-black transition ${items.length ? "bg-white text-black hover:bg-amber-100" : "pointer-events-none bg-white/10 text-white/35"}`}>
                Build Around These Picks <ChevronRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs leading-5 text-white/40">Your selections stay on this browser until you clear them.</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
