"use client";

import { useMemo, useState } from "react";
import { Clock3, SlidersHorizontal } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { VegasEvent } from "@/types/event";

const categories = [
  { value: "all", label: "All" },
  { value: "shows", label: "Shows" },
  { value: "comedy", label: "Comedy" },
  { value: "concerts", label: "Concerts" },
  { value: "sports", label: "Sports" },
  { value: "attractions", label: "Attractions" },
];

function eventHour(event: VegasEvent) {
  return event.localTime ? Number(event.localTime.split(":")[0]) : undefined;
}

export function TonightFilters({ events, isLive }: { events: VegasEvent[]; isLive: boolean }) {
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState("all");
  const [time, setTime] = useState("all");
  const [venue, setVenue] = useState("");

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        if (category !== "all" && event.category !== category) return false;
        if (price === "under-100" && (event.priceMin === undefined || event.priceMin >= 100)) return false;
        if (price === "100-200" && (event.priceMin === undefined || event.priceMin < 100 || event.priceMin >= 200)) return false;
        if (price === "200-plus" && (event.priceMin === undefined || event.priceMin < 200)) return false;
        const hour = eventHour(event);
        if (time === "early" && (hour === undefined || hour >= 19)) return false;
        if (time === "prime" && (hour === undefined || hour < 19 || hour >= 22)) return false;
        if (time === "late" && (hour === undefined || hour < 22)) return false;
        if (venue && !`${event.venueName} ${event.area}`.toLowerCase().includes(venue.toLowerCase())) return false;
        return true;
      }),
    [category, events, price, time, venue],
  );

  return (
    <>
      <div className="mb-7 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="grid flex-1 gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-950">
              {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid flex-1 gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
            Ticket price
            <select value={price} onChange={(event) => setPrice(event.target.value)} className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-950">
              <option value="all">Any price</option>
              <option value="under-100">Under $100</option>
              <option value="100-200">$100-$200</option>
              <option value="200-plus">$200+</option>
            </select>
          </label>
          <label className="grid flex-1 gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
            Start time
            <select value={time} onChange={(event) => setTime(event.target.value)} className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-950">
              <option value="all">Any time</option>
              <option value="early">Before 7 PM</option>
              <option value="prime">7-10 PM</option>
              <option value="late">After 10 PM</option>
            </select>
          </label>
          <label className="grid flex-[1.25] gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
            Venue or area
            <input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Sphere, Downtown, Bellagio..." className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium normal-case tracking-normal text-zinc-950 placeholder:text-zinc-400" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="inline-flex items-center gap-2 font-bold text-zinc-600"><SlidersHorizontal className="h-4 w-4 text-fuchsia-700" /> {filtered.length} of {events.length} options</p>
          <p className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500"><Clock3 className="h-4 w-4" /> {isLive ? "Live schedule for tonight" : "Curated options; confirm schedule"}</p>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, index) => <EventCard key={event.id} event={event} priority={index < 3} />)}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <h2 className="text-2xl font-black text-zinc-950">No exact matches</h2>
          <p className="mt-2 text-zinc-600">Try a wider time or price range. Vegas schedules can be surprisingly lopsided on a given night.</p>
          <button type="button" onClick={() => { setCategory("all"); setPrice("all"); setTime("all"); setVenue(""); }} className="mt-5 min-h-11 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-black text-white">Clear filters</button>
        </div>
      )}
    </>
  );
}
