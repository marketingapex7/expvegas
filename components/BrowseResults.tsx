"use client";

import Link from "next/link";
import { ChevronDown, LayoutGrid, Map as MapIcon, MapPinned, RotateCcw, Scale, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DirectoryCard } from "@/components/DirectoryCard";
import { EventCard } from "@/components/EventCard";
import { VegasAreaMap, VegasMapItem } from "@/components/VegasAreaMap";
import { BookingGuidance, DirectoryListing, EnvironmentType, VegasZone } from "@/types/directory";
import { VegasEvent } from "@/types/event";
import { formatPrice } from "@/lib/utils";
import { inferVegasZone } from "@/lib/vegas-logistics";

type Result =
  | { kind: "directory"; id: string; area: string; zone: VegasZone; environment: EnvironmentType; durationMin: number; durationMax: number; bookingGuidance: BookingGuidance; score: number; priceMin: number; searchable: string; item: DirectoryListing }
  | { kind: "event"; id: string; area: string; zone: VegasZone; environment: EnvironmentType; durationMin: number; durationMax: number; bookingGuidance: BookingGuidance; score: number; priceMin: number; searchable: string; item: VegasEvent };

const bookingLabels: Record<BookingGuidance, string> = {
  "book-now": "Book ahead",
  reserve: "Reserve ahead",
  flexible: "Usually flexible",
  free: "No booking",
  "check-availability": "Check schedule",
};

function directoryCostLabel(item: DirectoryListing) {
  if (item.costUnit === "free" || item.estimatedCostMax === 0) return "Free";
  const value = item.estimatedCostMin === item.estimatedCostMax
    ? `$${item.estimatedCostMin}`
    : `$${item.estimatedCostMin}-$${item.estimatedCostMax}`;
  const unit = item.costUnit === "per-person" ? " per person" : item.costUnit === "per-night" ? " per night" : "";
  return `${value}${unit}`;
}

function comparisonDetails(result: Result) {
  if (result.kind === "directory") {
    return {
      name: result.item.name,
      href: `/places/${result.item.slug}`,
      cost: directoryCostLabel(result.item),
      duration: result.item.durationLabel || `${result.durationMin}-${result.durationMax} minutes`,
      bestFor: result.item.bestFor.slice(0, 3).join(", "),
      timing: result.item.idealTime,
    };
  }

  return {
    name: result.item.name,
    href: `/${result.item.category}/${result.item.slug}`,
    cost: formatPrice(result.item.priceMin),
    duration: result.item.runtimeMinutes ? `${result.item.runtimeMinutes} minutes` : "Confirm runtime",
    bestFor: result.item.bestFor.slice(0, 3).join(", "),
    timing: result.item.localTime ? `Starts at ${result.item.localTime.slice(0, 5)}` : "Confirm showtime",
  };
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
      zone: inferVegasZone(item.area),
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

function ResultCard({
  result,
  comparisonSelected,
  comparisonDisabled,
  onToggleComparison,
}: {
  result: Result;
  comparisonSelected: boolean;
  comparisonDisabled: boolean;
  onToggleComparison: () => void;
}) {
  const name = result.item.name;
  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <div className="mb-2 flex min-h-9 justify-end">
        <button
          type="button"
          aria-label={`${comparisonSelected ? "Remove" : "Compare"} ${name}`}
          aria-pressed={comparisonSelected}
          disabled={comparisonDisabled && !comparisonSelected}
          onClick={onToggleComparison}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition ${
            comparisonSelected
              ? "bg-fuchsia-100 text-fuchsia-950"
              : "border border-zinc-300 bg-white text-zinc-600 hover:border-fuchsia-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          <Scale className="h-3.5 w-3.5" /> {comparisonSelected ? "Comparing" : "Compare"}
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {result.kind === "directory" ? <DirectoryCard listing={result.item} /> : <EventCard event={result.item} />}
      </div>
    </div>
  );
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
  const [view, setView] = useState<"grid" | "area" | "map">("grid");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
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
  const mapItems = useMemo<VegasMapItem[]>(() => results.map((result, index) => {
    if (result.kind === "directory") {
      return {
        id: result.id,
        name: result.item.name,
        area: result.area,
        zone: result.zone,
        href: `/places/${result.item.slug}`,
        mapUrl: result.item.mapUrl,
        label: `${directoryCostLabel(result.item)} · ${bookingLabels[result.bookingGuidance]}`,
        sequence: index + 1,
      };
    }

    return {
      id: result.id,
      name: result.item.name,
      area: result.item.venueName,
      zone: result.zone,
      href: `/${result.item.category}/${result.item.slug}`,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${result.item.venueName}, Las Vegas, NV`)}`,
      label: `${formatPrice(result.item.priceMin)} · ${bookingLabels[result.bookingGuidance]}`,
      sequence: index + 1,
    };
  }), [results]);
  const comparisonResults = useMemo(
    () => comparisonIds.flatMap((id) => {
      const result = source.find((item) => item.id === id);
      return result ? [result] : [];
    }),
    [comparisonIds, source],
  );

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

  function toggleComparison(id: string) {
    if (comparisonIds.includes(id)) {
      const next = comparisonIds.filter((item) => item !== id);
      setComparisonIds(next);
      if (next.length < 2) setComparisonOpen(false);
      return;
    }
    if (comparisonIds.length < 3) setComparisonIds([...comparisonIds, id]);
  }

  function clearComparison() {
    setComparisonIds([]);
    setComparisonOpen(false);
  }

  function resultCard(result: Result) {
    const selected = comparisonIds.includes(result.id);
    return (
      <ResultCard
        key={result.id}
        result={result}
        comparisonSelected={selected}
        comparisonDisabled={comparisonIds.length >= 3}
        onToggleComparison={() => toggleComparison(result.id)}
      />
    );
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
            <button type="button" onClick={() => setView("map")} aria-label="Map view" aria-pressed={view === "map"} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-xs font-black ${view === "map" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}><MapIcon className="h-4 w-4" /><span className="hidden sm:inline">Map</span></button>
          </div>
        </div>
      </div>

      {comparisonResults.length ? (
        <div data-testid="comparison-bar" className="mt-4 flex flex-col gap-3 border-y border-zinc-300 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-fuchsia-700">{comparisonResults.length} of 3 selected</p>
            <p className="mt-1 truncate text-sm font-bold text-zinc-600">{comparisonResults.map((result) => result.item.name).join(" vs. ")}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={clearComparison} className="min-h-10 rounded-lg px-3 text-xs font-black text-zinc-500 hover:bg-zinc-100">Clear</button>
            <button
              type="button"
              disabled={comparisonResults.length < 2}
              onClick={() => setComparisonOpen(true)}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-xs font-black text-white transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 sm:flex-none"
            >
              <Scale className="h-4 w-4" /> Compare {comparisonResults.length} picks
            </button>
          </div>
        </div>
      ) : null}

      {comparisonOpen && comparisonResults.length >= 2 ? (
        <section data-testid="comparison-panel" aria-labelledby="comparison-heading" className="mt-8 border-y border-zinc-300 py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700">Decision support</p>
              <h2 id="comparison-heading" className="mt-2 text-3xl font-black text-zinc-950">Compare your Vegas picks</h2>
            </div>
            <button type="button" onClick={() => setComparisonOpen(false)} aria-label="Close comparison" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100"><X className="h-4 w-4" /></button>
          </div>
          <div className={`mt-6 grid gap-4 ${comparisonResults.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {comparisonResults.map((result) => {
              const details = comparisonDetails(result);
              return (
                <article key={result.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-fuchsia-700">{result.zone}</p>
                  <h3 className="mt-2 text-xl font-black leading-snug text-zinc-950">{details.name}</h3>
                  <dl className="mt-5 divide-y divide-zinc-100 text-sm">
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-3"><dt className="font-black text-zinc-500">Cost</dt><dd className="font-bold text-zinc-900">{details.cost}</dd></div>
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-3"><dt className="font-black text-zinc-500">Time</dt><dd className="font-bold text-zinc-900">{details.duration}</dd></div>
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-3"><dt className="font-black text-zinc-500">Best for</dt><dd className="font-bold text-zinc-900">{details.bestFor}</dd></div>
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-3"><dt className="font-black text-zinc-500">When</dt><dd className="font-bold text-zinc-900">{details.timing}</dd></div>
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-3"><dt className="font-black text-zinc-500">Booking</dt><dd className="font-bold text-zinc-900">{bookingLabels[result.bookingGuidance]}</dd></div>
                  </dl>
                  <Link href={details.href} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-black text-zinc-900 hover:bg-zinc-100">View details</Link>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {results.length ? view === "grid" ? (
        <div className={`mt-6 grid gap-5 md:grid-cols-2 ${results.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>{results.map(resultCard)}</div>
      ) : view === "area" ? (
        <div className="mt-8 space-y-10">{grouped.map((group) => (
          <section key={group.area}>
            <div className="mb-4 flex items-center gap-2"><MapPinned className="h-5 w-5 text-fuchsia-700" /><h3 className="text-2xl font-black">{group.area}</h3><span className="text-sm font-bold text-zinc-400">{group.results.length}</span></div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{group.results.map(resultCard)}</div>
          </section>
        ))}</div>
      ) : (
        <div className="mt-6"><VegasAreaMap items={mapItems} title={`${title} by Vegas area`} testId="browse-map-view" /></div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-16 text-center"><p className="font-black text-zinc-950">No choices match those filters.</p><p className="mt-2 text-sm text-zinc-500">Try a broader neighborhood, price, or planning style.</p><button type="button" onClick={clearFilters} className="mt-3 text-sm font-bold text-fuchsia-700">Clear filters</button></div>
      )}
    </div>
  );
}
