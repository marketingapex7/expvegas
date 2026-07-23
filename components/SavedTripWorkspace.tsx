"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, CalendarDays, CheckCircle2, Clock, Copy, GripVertical, List, Lock, Map as MapIcon, MapPin, Plus, Route, ShieldCheck, Trash2, Unlock, WalletCards, Zap } from "lucide-react";
import { DragEvent as ReactDragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { CardImage } from "@/components/CardImage";
import { DateRangeFields } from "@/components/DateRangeFields";
import { directoryListings } from "@/lib/directory-data";
import { seedEvents } from "@/data/seed-events";
import { DirectoryCategory, TripDates, TripPick, TripPickStatus, TripSettings } from "@/types/directory";
import { formatPrice } from "@/lib/utils";
import { calculateTripBudget, formatCostRange, tripDayCount } from "@/lib/trip-budget";
import { estimateVegasTravel, inferVegasZone } from "@/lib/vegas-logistics";
import { PrintPlanButton } from "@/components/PrintPlanButton";
import { PrintableSavedTrip } from "@/components/PrintableItinerary";
import { VegasAreaMap, VegasMapItem } from "@/components/VegasAreaMap";

const categoryLabels: Record<DirectoryCategory, string> = {
  hotel: "Stays",
  event: "Shows and events",
  restaurant: "Restaurants",
  attraction: "Attractions",
  free: "Free experiences",
  shopping: "Shopping and exploring",
};

const statusOptions: { value: TripPickStatus; label: string }[] = [
  { value: "considering", label: "Considering" },
  { value: "must-do", label: "Must do" },
  { value: "booked", label: "Booked" },
  { value: "backup", label: "Backup" },
];

type SharedTrip = {
  v: 1;
  i: [string, TripPickStatus, 0 | 1][];
  d: TripDates;
  s: TripSettings;
  u?: TripPick[];
};

function addDays(value: string, days: number) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function directoryPick(id: string) {
  const listing = directoryListings.find((item) => item.id === id);
  if (!listing) return undefined;
  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    category: listing.category,
    area: listing.area,
    description: listing.description,
    imageUrl: listing.imageUrl,
    priceLabel: listing.priceLabel,
    durationLabel: listing.durationLabel,
    zone: listing.zone,
    detailUrl: `/places/${listing.slug}`,
    estimatedCostMin: listing.estimatedCostMin,
    estimatedCostMax: listing.estimatedCostMax,
    costUnit: listing.costUnit,
    bookingGuidance: listing.bookingGuidance,
    mapUrl: listing.mapUrl,
  } satisfies TripPick;
}

function eventPick(id: string) {
  const event = seedEvents.find((item) => item.id === id);
  if (!event) return undefined;
  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    category: "event" as const,
    area: event.area,
    description: event.quickVerdict,
    imageUrl: event.imageUrl || "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1200&q=82",
    priceLabel: formatPrice(event.priceMin),
    durationLabel: event.runtimeMinutes ? `${event.runtimeMinutes} minutes` : "Confirm runtime",
    zone: inferVegasZone(event.area),
    detailUrl: `/${event.category}/${event.slug}`,
    estimatedCostMin: event.priceMin,
    estimatedCostMax: event.priceMax || event.priceMin,
    costUnit: "per-person" as const,
    bookingGuidance: "check-availability" as const,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, Las Vegas, NV`)}`,
  } satisfies TripPick;
}

function encodePayload(payload: SharedTrip) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodePayload(value: string): SharedTrip | undefined {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as SharedTrip;
  } catch {
    return undefined;
  }
}

export function SavedTripWorkspace() {
  const { items, dates, settings, hydrated, removeItem, clearItems, setDates, setSettings, updateItem, reorderItem, moveItem, importTrip } = useTripSelections();
  const [draggedId, setDraggedId] = useState("");
  const [dragOverId, setDragOverId] = useState("");
  const [reorderMessage, setReorderMessage] = useState("");
  const [workspaceView, setWorkspaceView] = useState<"list" | "map">("list");
  const [shareMessage, setShareMessage] = useState("");
  const draggedIdRef = useRef("");
  const importedRef = useRef(false);
  const today = new Date().toISOString().slice(0, 10);
  const days = tripDayCount(dates);
  const datesReady = Boolean(dates.arrivalDate && dates.departureDate && dates.departureDate >= dates.arrivalDate);

  useEffect(() => {
    if (!hydrated || importedRef.current) return;
    const timer = window.setTimeout(() => {
      const encoded = new URLSearchParams(window.location.search).get("trip");
      if (!encoded) {
        importedRef.current = true;
        return;
      }
      const payload = decodePayload(encoded);
      if (!payload || payload.v !== 1) {
        importedRef.current = true;
        return;
      }
      const unknown = new Map((payload.u || []).map((item) => [item.id, item]));
      const importedItems: TripPick[] = payload.i.flatMap(([id, status, locked]) => {
        const item = directoryPick(id) || eventPick(id) || unknown.get(id);
        return item ? [{ ...item, status, locked: Boolean(locked) }] : [];
      });
      if (importedItems.length) importTrip(importedItems, payload.d, payload.s);
      importedRef.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, importTrip]);

  const budget = useMemo(() => calculateTripBudget(items, settings, dates), [dates, items, settings]);
  const cost = budget.total;
  const activeItems = useMemo(() => items.filter((item) => item.status !== "backup"), [items]);
  const travelTransitions = useMemo(() => activeItems.slice(1).map((item, index) => {
    const previous = activeItems[index];
    const estimate = estimateVegasTravel(
      previous.area,
      item.area,
      previous.zone || inferVegasZone(previous.area),
      item.zone || inferVegasZone(item.area),
    );
    return { from: previous, to: item, estimate };
  }), [activeItems]);
  const tripMapItems = useMemo<VegasMapItem[]>(() => items.map((item, index) => ({
    id: item.id,
    name: item.name,
    area: item.area,
    zone: item.zone || inferVegasZone(item.area),
    href: item.detailUrl,
    mapUrl: item.mapUrl,
    label: item.status === "backup" ? "Backup option" : item.status === "booked" ? "Booked" : item.status === "must-do" ? "Must do" : "Considering",
    sequence: index + 1,
  })), [items]);

  const checks = useMemo(() => {
    const issues: { label: string; penalty: number }[] = [];
    const eventCount = activeItems.filter((item) => item.category === "event").length;
    const areaCount = new Set(activeItems.map((item) => item.area)).size;
    if (!datesReady) issues.push({ label: "Choose trip dates before checking schedules.", penalty: 15 });
    if (!activeItems.some((item) => item.category === "restaurant")) issues.push({ label: "Add at least one meal anchor.", penalty: 8 });
    if (!activeItems.some((item) => item.category === "free" || item.category === "shopping")) issues.push({ label: "Add a free or flexible stop for breathing room.", penalty: 7 });
    if (eventCount > days) issues.push({ label: "There may be too many fixed events for the trip length.", penalty: 12 });
    if (activeItems.length > days * 5) issues.push({ label: "The shortlist is crowded; move lower-priority ideas to Backup.", penalty: 12 });
    if (areaCount > Math.max(3, days + 1)) issues.push({ label: "The plan crosses many Vegas areas and may create excessive travel.", penalty: 10 });
    const longestTransition = travelTransitions.reduce((longest, transition) => (
      transition.estimate.maxMinutes > (longest?.estimate.maxMinutes || 0) ? transition : longest
    ), travelTransitions[0]);
    if (longestTransition?.estimate.maxMinutes >= 35) {
      issues.push({
        label: `${longestTransition.from.name} to ${longestTransition.to.name} may need ${longestTransition.estimate.minMinutes}-${longestTransition.estimate.maxMinutes} minutes in normal traffic.`,
        penalty: 10,
      });
    }
    if (settings.budgetCap > 0 && cost.min > settings.budgetCap) issues.push({ label: "The low-end estimate is already above your target budget.", penalty: 18 });
    return issues;
  }, [activeItems, cost.min, datesReady, days, settings.budgetCap, travelTransitions]);

  const planScore = Math.max(35, 100 - checks.reduce((sum, issue) => sum + issue.penalty, 0));

  async function shareTrip() {
    const knownIds = new Set([...directoryListings.map((item) => item.id), ...seedEvents.map((item) => item.id)]);
    const payload: SharedTrip = {
      v: 1,
      i: items.map((item) => [item.id, item.status || "considering", item.locked ? 1 : 0]),
      d: dates,
      s: settings,
      u: items.filter((item) => !knownIds.has(item.id)),
    };
    const url = `${window.location.origin}/my-trip?trip=${encodePayload(payload)}`;
    const canShare = typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title: "Our Vegas itinerary", text: "Review our saved Vegas ideas.", url });
      else await navigator.clipboard.writeText(url);
      setShareMessage(canShare ? "Planning link shared." : "Planning link copied.");
    } catch {
      setShareMessage("Sharing was canceled.");
    }
  }

  function canReorder(sourceId: string, targetId: string) {
    const sourceIndex = items.findIndex((item) => item.id === sourceId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;
    const firstIndex = Math.min(sourceIndex, targetIndex);
    const lastIndex = Math.max(sourceIndex, targetIndex);
    return !items.slice(firstIndex, lastIndex + 1).some((item) => item.locked);
  }

  function handleDragStart(event: ReactDragEvent<HTMLElement>, item: TripPick) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
    draggedIdRef.current = item.id;
    setDraggedId(item.id);
    setReorderMessage("");
  }

  function handleDrop(event: ReactDragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    const sourceId = draggedIdRef.current || event.dataTransfer.getData("text/plain");
    const source = items.find((item) => item.id === sourceId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceId === targetId) {
      setDraggedId("");
      setDragOverId("");
      draggedIdRef.current = "";
      return;
    }
    if (!canReorder(sourceId, targetId)) {
      setReorderMessage("Booked picks stay locked in their current position.");
      setDraggedId("");
      setDragOverId("");
      draggedIdRef.current = "";
      return;
    }
    reorderItem(sourceId, targetId);
    setReorderMessage(`${source?.name || "Pick"} moved to position ${targetIndex + 1}. Travel estimates updated.`);
    setDraggedId("");
    setDragOverId("");
    draggedIdRef.current = "";
  }

  function moveAndAnnounce(item: TripPick, index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (item.locked || items[targetIndex]?.locked) return;
    moveItem(item.id, direction);
    setReorderMessage(`${item.name} moved to position ${targetIndex + 1}. Travel estimates updated.`);
  }

  if (!hydrated) return <div className="min-h-[60vh] bg-[#f7f7f8]" />;

  return (
    <main className="bg-[#f7f7f8] px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-700">Your saved Vegas shortlist</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">My Itinerary</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">Prioritize the places you care about, lock booked plans, and move optional ideas to Backup before the planner builds the schedule.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {items.length ? <PrintPlanButton /> : null}
            {items.length ? <button type="button" onClick={shareTrip} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-black hover:bg-zinc-100"><Copy className="h-4 w-4" /> Share</button> : null}
            {items.length ? <button type="button" onClick={clearItems} className="min-h-11 px-3 text-sm font-bold text-zinc-500 hover:text-zinc-950">Clear all</button> : null}
          </div>
        </div>
        {shareMessage ? <p className="mt-3 text-sm font-bold text-fuchsia-700">{shareMessage}</p> : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-label="Saved itinerary items">
            {items.length ? (
              <div className="mb-4 flex justify-end">
                <div className="inline-flex rounded-lg border border-zinc-300 bg-zinc-100 p-1" aria-label="Itinerary view">
                  <button type="button" onClick={() => setWorkspaceView("list")} aria-label="Itinerary list view" aria-pressed={workspaceView === "list"} className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-black ${workspaceView === "list" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}><List className="h-4 w-4" /> List</button>
                  <button type="button" onClick={() => setWorkspaceView("map")} aria-label="Itinerary map view" aria-pressed={workspaceView === "map"} className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-black ${workspaceView === "map" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}><MapIcon className="h-4 w-4" /> Map</button>
                </div>
              </div>
            ) : null}
            <p id="reorder-status" aria-live="polite" className="sr-only">{reorderMessage}</p>
            {items.length && workspaceView === "list" ? (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    data-testid={`itinerary-item-${item.id}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (draggedIdRef.current && draggedIdRef.current !== item.id) setDragOverId(item.id);
                    }}
                    onDrop={(event) => handleDrop(event, item.id)}
                    aria-describedby="reorder-status"
                    className={`overflow-hidden rounded-lg border bg-white shadow-sm transition ${
                      dragOverId === item.id ? "border-fuchsia-500 ring-2 ring-fuchsia-100" : item.locked ? "border-amber-300" : "border-zinc-200"
                    } ${draggedId === item.id ? "opacity-55" : ""}`}
                  >
                    <div className="grid sm:grid-cols-[9rem_1fr]">
                      <Link href={item.detailUrl} className="relative min-h-36 bg-zinc-200">
                        <CardImage src={item.imageUrl} alt={item.name} category={item.category} sizes="144px" />
                      </Link>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-fuchsia-700">{categoryLabels[item.category]} / #{index + 1}</p>
                            <Link href={item.detailUrl} className="mt-1 block text-xl font-black leading-snug text-zinc-950 hover:text-fuchsia-800">{item.name}</Link>
                            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-zinc-500"><MapPin className="h-3.5 w-3.5" /> {item.area}</p>
                          </div>
                          <div className="flex items-center">
                            <span
                              data-testid={`reorder-handle-${item.id}`}
                              title={item.locked ? "Unlock to reorder" : "Drag to reorder"}
                              draggable={!item.locked}
                              onDragStart={(event) => handleDragStart(event, item)}
                              onDragEnd={() => { draggedIdRef.current = ""; setDraggedId(""); setDragOverId(""); }}
                              className={`hidden sm:inline-flex ${item.locked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
                            >
                              <GripVertical className={`h-5 w-5 ${item.locked ? "text-zinc-200" : "text-zinc-400"}`} />
                            </span>
                            <button type="button" onClick={() => updateItem(item.id, { locked: !item.locked })} aria-label={item.locked ? `Unlock ${item.name}` : `Lock ${item.name}`} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.locked ? "bg-amber-100 text-amber-900" : "text-zinc-400 hover:bg-zinc-100"}`}>{item.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
                            <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {statusOptions.map((option) => <button key={option.value} type="button" onClick={() => updateItem(item.id, { status: option.value, ...(option.value === "booked" ? { locked: true } : {}) })} className={`rounded-full px-3 py-1.5 text-xs font-black ${item.status === option.value || (!item.status && option.value === "considering") ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>{option.label}</button>)}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                          <div className="flex flex-wrap gap-3 text-xs font-bold text-zinc-500">
                            {item.priceLabel ? <span className="inline-flex items-center gap-1"><WalletCards className="h-3.5 w-3.5" /> {item.priceLabel}</span> : null}
                            {item.durationLabel ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {item.durationLabel}</span> : null}
                            {item.mapUrl ? <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-fuchsia-700"><MapPin className="h-3.5 w-3.5" /> Map</a> : null}
                          </div>
                          <div className="flex gap-1">
                            <button type="button" title="Move earlier" disabled={index === 0 || item.locked || items[index - 1]?.locked} onClick={() => moveAndAnnounce(item, index, -1)} aria-label={`Move ${item.name} up`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                            <button type="button" title="Move later" disabled={index === items.length - 1 || item.locked || items[index + 1]?.locked} onClick={() => moveAndAnnounce(item, index, 1)} aria-label={`Move ${item.name} down`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : items.length ? (
              <VegasAreaMap items={tripMapItems} title="Your itinerary by Vegas area" testId="itinerary-map-view" />
            ) : (
              <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-6 text-center">
                <Plus className="h-8 w-8 text-fuchsia-700" />
                <h2 className="mt-4 text-2xl font-black">Start building your Vegas shortlist</h2>
                <p className="mt-2 max-w-md leading-7 text-zinc-600">Browse hotels, events, restaurants, attractions, and free experiences. Add anything you want the planner to consider.</p>
                <Link href="/" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-black text-white hover:bg-fuchsia-800">Browse Vegas <ArrowRight className="h-4 w-4" /></Link>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700"><CalendarDays className="h-4 w-4" /> Trip basics</p>
              <div className="mt-4 grid min-w-0 grid-cols-2 gap-3">
                <DateRangeFields arrivalDate={dates.arrivalDate} departureDate={dates.departureDate} minArrival={today} maxDeparture={addDays(dates.arrivalDate, 7)} onArrivalChange={(value) => setDates({ arrivalDate: value, departureDate: dates.departureDate < value ? "" : dates.departureDate })} onDepartureChange={(value) => setDates({ ...dates, departureDate: value })} />
                <label className="grid min-w-0 gap-1.5 text-xs font-black text-zinc-600">Travelers<input type="number" min="1" max="20" value={settings.partySize} onChange={(event) => setSettings({ ...settings, partySize: Math.max(1, Number(event.target.value) || 1) })} className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-fuchsia-600" /></label>
                <label className="grid min-w-0 gap-1.5 text-xs font-black text-zinc-600">Target budget<input type="number" min="0" step="100" value={settings.budgetCap || ""} placeholder="Optional" onChange={(event) => setSettings({ ...settings, budgetCap: Math.max(0, Number(event.target.value) || 0) })} className="min-h-11 w-full max-w-full min-w-0 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-fuchsia-600" /></label>
              </div>
            </div>

            {items.length ? <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700"><ShieldCheck className="h-4 w-4" /> Plan health</p><span className={`text-2xl font-black ${planScore >= 85 ? "text-emerald-700" : planScore >= 65 ? "text-amber-700" : "text-rose-700"}`}>{planScore}</span></div>
              {checks.length ? <ul className="mt-4 space-y-2">{checks.map((check) => <li key={check.label} className="text-sm leading-6 text-zinc-600">- {check.label}</li>)}</ul> : <p className="mt-4 inline-flex items-start gap-2 text-sm font-bold leading-6 text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> The shortlist has a strong balance for planning.</p>}
            </div> : null}

            {travelTransitions.length ? (
              <div data-testid="travel-reality" className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700"><Route className="h-4 w-4" /> Travel reality</p>
                <div className="mt-4 space-y-3">
                  {travelTransitions.slice(0, 4).map((transition) => (
                    <div key={`${transition.from.id}-${transition.to.id}`} className="border-l-2 border-zinc-200 pl-3">
                      <p className="text-sm font-black text-zinc-950">{transition.from.name} to {transition.to.name}</p>
                      <p className="mt-1 text-xs font-bold text-zinc-500">{transition.estimate.minMinutes}-{transition.estimate.maxMinutes} min | {transition.estimate.label}</p>
                    </div>
                  ))}
                </div>
                {travelTransitions.length > 4 ? <p className="mt-3 text-xs font-bold text-zinc-500">Plus {travelTransitions.length - 4} more transition{travelTransitions.length - 4 === 1 ? "" : "s"}.</p> : null}
                <p className="mt-4 text-xs leading-5 text-zinc-500">Planning estimate based on the current shortlist order. Event traffic and resort walking time can add more.</p>
              </div>
            ) : null}

            <div className="rounded-lg bg-zinc-950 p-5 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Working estimate</p>
              <p className="mt-2 text-3xl font-black">{items.length ? formatCostRange(cost) : "-"}</p>
              {!items.length ? <p className="mt-2 text-sm font-bold text-white/75">Add picks to see an estimate.</p> : null}
              {items.length ? (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {Object.entries(budget.categories).map(([label, amount]) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{label}</p>
                      <p className="mt-1 text-sm font-black text-white">{amount.max > 0 ? formatCostRange(amount) : "$0"}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="mt-2 text-xs leading-5 text-white/55">For {settings.partySize} traveler{settings.partySize === 1 ? "" : "s"}; hotel estimates assume one room. Shopping, gambling, fees, tax, and transportation are excluded until live partners provide totals.</p>
              {settings.budgetCap > 0 ? <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className={`h-full ${cost.min > settings.budgetCap ? "bg-rose-400" : "bg-amber-300"}`} style={{ width: `${Math.min(100, (cost.min / settings.budgetCap) * 100)}%` }} /></div> : null}
              <Link href="/planner" aria-disabled={!items.length || !datesReady} className={`mt-5 flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black ${items.length && datesReady ? "bg-amber-300 text-zinc-950 hover:bg-amber-200" : "pointer-events-none border border-white/20 bg-white/15 text-white/65"}`}>Build My Timed Itinerary <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/now" className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-black text-white hover:bg-white/10"><Zap className="h-4 w-4" /> What Should We Do Now?</Link>
            </div>
          </aside>
        </div>
        {items.length ? <PrintableSavedTrip items={items} dates={dates} settings={settings} /> : null}
      </div>
    </main>
  );
}
