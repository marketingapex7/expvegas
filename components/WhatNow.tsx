"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Navigation, WalletCards, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useTripSelections } from "@/components/TripSelectionProvider";

export function WhatNow() {
  const { items, hydrated, updateItem } = useTripSelections();
  const areas = useMemo(() => [...new Set(items.map((item) => item.area))].sort(), [items]);
  const [area, setArea] = useState("");
  const [spend, setSpend] = useState("any");
  const [time, setTime] = useState("90");

  const recommendations = useMemo(() => items
    .filter((item) => item.status !== "booked")
    .map((item) => {
      let score = item.status === "must-do" ? 20 : item.status === "backup" ? 4 : 10;
      if (area && item.area === area) score += 20;
      if (spend === "free" && (item.costUnit === "free" || (item.estimatedCostMin || 0) === 0)) score += 15;
      if (spend === "under-50" && (item.estimatedCostMin || 0) < 50) score += 10;
      const minutes = Number(item.durationLabel?.match(/\d+/)?.[0] || 90);
      if (minutes <= Number(time)) score += 8;
      if (item.category === "free" || item.category === "shopping") score += 4;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3), [area, items, spend, time]);

  if (!hydrated) return <main className="min-h-[70vh] bg-[#f7f7f8]" />;

  return (
    <main className="min-h-[70vh] bg-[#f7f7f8] px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700"><Zap className="h-4 w-4" /> In-trip mode</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">What should we do now?</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">Use your current area, available time, and spend limit to choose the strongest next move from your saved itinerary.</p>

        <div className="mt-8 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Current area<select value={area} onChange={(event) => setArea(event.target.value)} className="min-h-12 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-900"><option value="">Anywhere</option>{areas.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Time available<select value={time} onChange={(event) => setTime(event.target.value)} className="min-h-12 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-900"><option value="60">About 1 hour</option><option value="90">About 90 minutes</option><option value="180">Up to 3 hours</option><option value="480">Most of the day</option></select></label>
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Spend<select value={spend} onChange={(event) => setSpend(event.target.value)} className="min-h-12 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-900"><option value="any">Any spend</option><option value="free">Free</option><option value="under-50">Under $50</option></select></label>
        </div>

        {recommendations.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {recommendations.map(({ item }, index) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-zinc-200">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="33vw" className="object-cover" /> : null}<span className="absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-black text-zinc-950">#{index + 1} next pick</span></div>
                <div className="p-5">
                  <h2 className="text-xl font-black">{item.name}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-zinc-500"><MapPin className="h-4 w-4" /> {item.area}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-zinc-500">{item.durationLabel ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {item.durationLabel}</span> : null}<span className="inline-flex items-center gap-1"><WalletCards className="h-3.5 w-3.5" /> {item.priceLabel}</span></div>
                  <div className="mt-5 grid gap-2">
                    {item.mapUrl ? <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-black text-white hover:bg-fuchsia-800"><Navigation className="h-4 w-4" /> Get Directions</a> : null}
                    <button type="button" onClick={() => updateItem(item.id, { status: "must-do" })} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-black hover:bg-zinc-100">Make this the next priority</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center"><h2 className="text-2xl font-black">Save a few places first.</h2><p className="mt-2 text-zinc-600">This mode recommends the best next move from your itinerary.</p><Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-black text-white">Browse Vegas <ArrowRight className="h-4 w-4" /></Link></div>
        )}
      </div>
    </main>
  );
}
