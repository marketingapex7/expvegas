"use client";

import { ChevronDown, LayoutGrid, MapPinned, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { DirectoryCard } from "@/components/DirectoryCard";
import { EventCard } from "@/components/EventCard";
import { BookingGuidance, DirectoryListing, EnvironmentType, VegasZone } from "@/types/directory";
import { VegasEvent } from "@/types/event";

type Result =
  | { kind: "directory"; id: string; area: string; zone: VegasZone; environment: EnvironmentType; durationMin: number; durationMax: number; bookingGuidance: BookingGuidance; score: number; priceMin: number; searchable: string; item: DirectoryListing }
  | { kind: "event"; id: string; area: string; zone: VegasZone; environment: EnvironmentType; durationMin: number; durationMax: number; bookingGuidance: BookingGuidance; score: number; priceMin: number; searchable: string; item: VegasEvent };

function eventZone(area: string): VegasZone {
  const text = area.toLowerCase();
  if (text.includes("downtown") || text.includes("fremont")) return "Downtown";
  if (text.includes("off strip") || text.includes("east") || text.includes("west")) return "Off Strip";
  if (text.includes("south") || text.includes("t-mobile") || text.includes("allegiant")) return "South Strip";
  if (text.includes("north") || text.includes("venetian") || text.includes("sphere") || text.includes("wynn")) return "North Strip";
  return "Center Strip";
}

function normalizedResults(directory: DirectoryListing[], events: VegasEvent[]): Result[] {
  return [
    ...directory.map((item) => ({
      kind: "directory" as const,
      id: item.id,
      area: item.area,
      zone: item.zone,
      environment: item.environment,
      durationMin: item.durationMinMinutes,
      durationMax: item.durationMaxMinutes,
      bookingGuidance: item.bookingGuidance,
      score: item.editorialScore,
      priceMin: item.estimatedCostMin,
      searchable: `${item.name} ${item.area} ${item.zone} ${item.environment} ${item.idealTime} ${item.description} ${item.tags.join(" ")} ${item.bestFor.join(" ")}`.toLowerCase(),
      item,
    })),
    ...events.map((item) => ({
      kind: "event" as const,
      id: item.id,
      area: item.area,
      zone: eventZone(item.area),
      environment: "Indoor" as const,
      durationMin: item.runtimeMinutes || 60,
      durationMax: item.runtimeMinutes || 120,
      bookingGuidance: item.affiliateUrl && item.affiliateUrl !== "#" ? "book-now" as const : "check-availability" as const,
      score: item.editorialScore,
      priceMin: item.priceMin || 0,
      searchable: `${item.name} ${item.area} ${item.venueName} ${item.quickVerdict} ${item.tags.join(" ")} ${item.bestFor.join(" ")}`.toLowerCase(),
      item,
    })),
  ];
}

function ResultCard({ result }: { result: Result }) {
  return result.kind === "directory" ? <DirectoryCard listing={result.item} /> : <EventCard event={result.item} />;
}

export function BrowseResults({ directory, events, title }: { directory: DirectoryListing[]; events: VegasEvent[]; title: string }) {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("all");
  const [price, setPrice] = useState("all");
  const [audience, setAudience] = useState("all");
  const [duration, setDuration] = useState("all");
  const [environment, setEnvironment] = useState("all");
  const [booking, setBooking] = useState("all");
  const [vibe, setVibe] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState<"grid" | "area">("grid");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const source = useMemo(() => normalizedResults(directory, events), [directory, events]);
  const zones = useMemo(() => [...new Set(source.map((result) => result.zone))].sort(), [source]);
  const hasDurationChoices = source.some((result) => result.durationMax > 0);
  const activeFilterCount = [zone, price, audience, duration, environment, booking, vibe].filter((value) => value !== "all").length + Number(Boolean(query));

  const results = useMemo(() => {
    const next = source.filter((result) => {
      if (query && !result.searchable.includes(query.toLowerCase())) return false;
      if (zone !== "all" && result.zone !== zone) return false;
      if (price === "free" && result.priceMin > 0) return false;
      if (price === "under-50" && result.priceMin >= 50) return false;
      if (price === "under-100" && result.priceMin >= 100) return false;
      if (price === "premium" && result.priceMin < 100) return false;
      if (audience !== "all" && !result.searchable.includes(audience)) return false;
      if (duration === "quick" && (result.durationMax === 0 || result.durationMax > 60)) return false;
      if (duration === "standard" && (result.durationMax === 0 || result.durationMin > 120 || result.durationMax < 60)) return false;
      if (duration === "half-day" && result.durationMax <= 120) return false;
      if (environment !== "all" && result.environment.toLowerCase() !== environment) return false;
      if (booking === "flexible" && !["free", "flexible"].includes(result.bookingGuidance)) return false;
      if (booking === "plan-ahead" && ["free", "flexible"].includes(result.bookingGuidance)) return false;
      if (vibe !== "all" && !result.searchable.includes(vibe)) return false;
      return true;
    });

    return next.sort((a, b) => {
      if (sort === "price-low") return a.priceMin - b.priceMin;
      if (sort === "price-high") return b.priceMin - a.priceMin;
      if (sort === "name") return a.item.name.localeCompare(b.item.name);
      return b.score - a.score;
    });
  }, [audience, booking, duration, environment, price, query, sort, source, vibe, zone]);

  const grouped = useMemo(() => [...new Set(results.map((result) => result.area))].map((groupArea) => ({
    area: groupArea,
    results: results.filter((result) => result.area === groupArea),
  })), [results]);

  function clearFilters() {
    setQuery("");
    setZone("all");
    setPrice("all");
    setAudience("all");
    setDuration("all");
    setEnvironment("all");
    setBooking("all");
    setVibe("all");
  }

  return (
    <div>
      <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(14rem,1fr)_repeat(4,minmax(0,auto))]">
          <label className="relative block">
            <span className="sr-only">Search {title}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm font-bold outline-none focus:border-fuchsia-600" />
          </label>
          <label className="grid gap-1 text-xs font-black text-zinc-500">
            <span className="sr-only">Neighborhood</span>
            <select value={zone} onChange={(event) => setZone(event.target.value)} className="min-h-11 appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 shadow-sm outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-100">
              <option value="all">All neighborhoods</option>
              {zones.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Price</span>
            <select value={price} onChange={(event) => setPrice(event.target.value)} className="min-h-11 appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 shadow-sm outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-100">
              <option value="all">Any price</option>
              <option value="free">Free</option>
              <option value="under-50">Under $50</option>
              <option value="under-100">Under $100</option>
              <option value="premium">Premium $100+</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Best for</span>
            <select value={audience} onChange={(event) => setAudience(event.target.value)} className="min-h-11 appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 shadow-sm outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-100">
              <option value="all">Everyone</option>
              <option value="family">Families</option>
              <option value="couple">Couples</option>
              <option value="group">Groups</option>
              <option value="first-timer">First-timers</option>
              <option value="adult">Adults</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort results</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 shadow-sm outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-100">
              <option value="recommended">Recommended</option>
              <option value="price-low">Lowest price</option>
              <option value="price-high">Highest price</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div className="mt-3 border-t border-zinc-100 pt-3">
          <button
            type="button"
            aria-expanded={showMoreFilters}
            onClick={() => setShowMoreFilters((current) => !current)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-black text-zinc-700 transition hover:bg-zinc-100"
          >
            <SlidersHorizontal className="h-4 w-4 text-fuchsia-700" />
            More filters
            {[duration, environment, booking, vibe].filter((value) => value !== "all").length ? (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-fuchsia-100 px-2 text-xs text-fuchsia-900">{[duration, environment, booking, vibe].filter((value) => value !== "all").length}</span>
            ) : null}
            <ChevronDown className={`h-4 w-4 transition ${showMoreFilters ? "rotate-180" : ""}`} />
          </button>
          {showMoreFilters ? (
            <div className="mt-3 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              {hasDurationChoices ? (
                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Time needed</span>
                  <select value={duration} onChange={(event) => setDuration(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 outline-none focus:border-fuchsia-600">
                    <option value="all">Any duration</option>
                    <option value="quick">About 60 minutes or less</option>
                    <option value="standard">About 1-2 hours</option>
                    <option value="half-day">More than 2 hours</option>
                  </select>
                </label>
              ) : <div />}
              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Setting</span>
                <select value={environment} onChange={(event) => setEnvironment(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 outline-none focus:border-fuchsia-600">
                  <option value="all">Indoor or outdoor</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Planning style</span>
                <select value={booking} onChange={(event) => setBooking(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 outline-none focus:border-fuchsia-600">
                  <option value="all">Any booking style</option>
                  <option value="flexible">Flexible / no booking</option>
                  <option value="plan-ahead">Plan or reserve ahead</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Vibe</span>
                <select value={vibe} onChange={(event) => setVibe(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-800 outline-none focus:border-fuchsia-600">
                  <option value="all">Any vibe</option>
                  <option value="high energy">High energy</option>
                  <option value="romantic">Romantic</option>
                  <option value="luxury">Luxury</option>
                  <option value="family">Family-friendly</option>
                  <option value="not too touristy">Less touristy</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500"><SlidersHorizontal className="h-4 w-4" /> {results.length} choice{results.length === 1 ? "" : "s"}</p>
            {activeFilterCount ? <button type="button" onClick={clearFilters} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-black text-fuchsia-800 hover:bg-fuchsia-50"><RotateCcw className="h-3.5 w-3.5" /> Clear {activeFilterCount}</button> : null}
          </div>
          <div className="inline-flex rounded-lg border border-zinc-300 bg-zinc-50 p-1" aria-label="Result layout">
            <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-xs font-black ${view === "grid" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}><LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline">Grid</span></button>
            <button type="button" onClick={() => setView("area")} aria-label="Group by area" aria-pressed={view === "area"} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-xs font-black ${view === "area" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}><MapPinned className="h-4 w-4" /><span className="hidden sm:inline">By area</span></button>
          </div>
        </div>
      </div>

      {results.length ? view === "grid" ? (
        <div className={`mt-6 grid gap-5 md:grid-cols-2 ${results.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>{results.map((result) => <ResultCard key={result.id} result={result} />)}</div>
      ) : (
        <div className="mt-8 space-y-10">{grouped.map((group) => (
          <section key={group.area}>
            <div className="mb-4 flex items-center gap-2"><MapPinned className="h-5 w-5 text-fuchsia-700" /><h3 className="text-2xl font-black">{group.area}</h3><span className="text-sm font-bold text-zinc-400">{group.results.length}</span></div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{group.results.map((result) => <ResultCard key={result.id} result={result} />)}</div>
          </section>
        ))}</div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-16 text-center"><p className="font-black text-zinc-950">No choices match those filters.</p><p className="mt-2 text-sm text-zinc-500">Try a broader neighborhood, price, or planning style.</p><button type="button" onClick={clearFilters} className="mt-3 text-sm font-bold text-fuchsia-700">Clear filters</button></div>
      )}
    </div>
  );
}
