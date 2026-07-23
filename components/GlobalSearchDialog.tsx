"use client";

import Link from "next/link";
import { Building2, Drama, MapPin, Search, Utensils, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { seedEvents } from "@/data/seed-events";
import { directoryListings } from "@/lib/directory-data";

const categoryIcon = {
  hotel: Building2,
  restaurant: Utensils,
  attraction: MapPin,
  free: MapPin,
  shopping: MapPin,
  event: Drama,
};

const searchItems = [
  ...directoryListings.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    area: item.area,
    detail: item.description,
    href: `/places/${item.slug}`,
    searchable: `${item.name} ${item.category} ${item.area} ${item.tags.join(" ")} ${item.bestFor.join(" ")}`.toLowerCase(),
  })),
  ...seedEvents.map((item) => ({
    id: item.id,
    name: item.name,
    category: "event" as const,
    area: item.area,
    detail: item.quickVerdict,
    href: `/${item.category}/${item.slug}`,
    searchable: `${item.name} ${item.category} ${item.subcategory || ""} ${item.venueName} ${item.area} ${item.tags.join(" ")}`.toLowerCase(),
  })),
];

export function GlobalSearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchItems.slice(0, 8);
    const words = normalized.split(/\s+/);
    return searchItems.filter((item) => words.every((word) => item.searchable.includes(word))).slice(0, 10);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[90] bg-black/75 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="Search ExperienceVegas" className="mx-auto max-h-[72vh] max-w-2xl overflow-hidden rounded-lg border border-white/15 bg-[#100e15] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 p-3">
          <Search className="ml-2 h-5 w-5 shrink-0 text-amber-100" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hotels, restaurants, shows, venues..." className="min-h-11 min-w-0 flex-1 bg-transparent text-base font-bold text-white outline-none placeholder:text-white/35" />
          <button type="button" onClick={onClose} aria-label="Close search" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[58vh] overflow-y-auto p-2">
          {results.length ? results.map((item) => {
            const Icon = categoryIcon[item.category];
            return (
              <Link key={`${item.category}-${item.id}`} href={item.href} onClick={onClose} className="flex items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/[0.07]">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-100"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0">
                  <span className="block font-black text-white">{item.name}</span>
                  <span className="mt-1 block truncate text-xs font-bold uppercase tracking-[0.12em] text-white/40">{item.category} / {item.area}</span>
                  <span className="mt-1 block line-clamp-1 text-sm text-white/55">{item.detail}</span>
                </span>
              </Link>
            );
          }) : (
            <div className="px-6 py-12 text-center">
              <p className="text-lg font-black text-white">No exact match</p>
              <p className="mt-2 text-sm text-white/55">Try the venue, neighborhood, cuisine, or type of experience.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
