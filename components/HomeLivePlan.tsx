"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronDown, Clock3, MapPin, Route, Sparkles, Users, WalletCards } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { trackProductEvent } from "@/lib/product-analytics";
import { estimateVegasTravel } from "@/lib/vegas-logistics";
import { ItineraryBlock, PlannerResponse } from "@/types/planner";

type HomePlanControls = {
  arrivalDate: string;
  departureDate: string;
  partySize: number;
  budget: "value" | "mid" | "premium";
};

const budgetLabels = {
  value: "Value budget",
  mid: "Mid budget",
  premium: "Premium budget",
};

const budgetPlannerValues = {
  value: "event tickets under $100 per person",
  mid: "event tickets from $100-$200 per person",
  premium: "premium event tickets are okay if worth it",
};

const categoryLabels: Record<ItineraryBlock["category"], string> = {
  meal: "Meal",
  event: "Event",
  attraction: "Attraction",
  casino: "Casino",
  shopping: "Flexible",
  transit: "Transfer",
  free: "Free",
};

function formatDateRange(arrivalDate: string, departureDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${formatter.format(new Date(`${arrivalDate}T12:00:00`))} - ${formatter.format(new Date(`${departureDate}T12:00:00`))}`;
}

function PlanBlock({ block, previous }: { block: ItineraryBlock; previous?: ItineraryBlock }) {
  const travel = previous?.location && block.location
    ? estimateVegasTravel(previous.location, block.location)
    : null;

  return (
    <div className="min-w-0">
      {travel ? (
        <div className="flex items-center gap-2 px-2 py-2 text-[11px] font-bold text-white/48">
          <Route className="h-3.5 w-3.5 shrink-0 text-amber-200" />
          Allow {travel.minMinutes}-{travel.maxMinutes} min between stops
        </div>
      ) : null}
      <article className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:p-4">
        <div>
          <p className="text-sm font-black text-amber-100">{block.time}</p>
          <span className="mt-2 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/60">
            {categoryLabels[block.category]}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-black leading-tight text-white">{block.title}</h3>
          {block.location ? <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-white/60"><MapPin className="h-3.5 w-3.5" /> {block.location}</p> : null}
          {block.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62 sm:line-clamp-none">{block.description}</p> : null}
          {block.priceHint ? <p className="mt-2 text-xs font-black text-emerald-200">{block.priceHint}</p> : null}
        </div>
      </article>
    </div>
  );
}

export function HomeLivePlan({
  initialResult,
  initialControls,
  minDate,
}: {
  initialResult: PlannerResponse;
  initialControls: HomePlanControls;
  minDate: string;
}) {
  const { setDates, setSettings, settings } = useTripSelections();
  const [controls, setControls] = useState(initialControls);
  const [result, setResult] = useState(initialResult);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const requestId = useRef(0);

  const firstDay = result.itineraryDays?.[0];
  const secondDay = result.itineraryDays?.[1];
  const plannerHref = useMemo(() => `/planner?refine=1&budget=${controls.budget}`, [controls.budget]);

  useEffect(() => {
    trackProductEvent("homepage_plan_preview_rendered", {
      days: result.itineraryDays?.length || 0,
      live: result.sourceSummary?.startsWith("Live") || false,
    });
  }, [result.itineraryDays?.length, result.sourceSummary]);

  async function regenerate(next: HomePlanControls, changed: keyof HomePlanControls) {
    setControls(next);
    setUpdating(true);
    setUpdateMessage("");
    const currentRequest = ++requestId.current;
    trackProductEvent("homepage_plan_control_changed", { control: changed });

    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelDates: `${next.arrivalDate} to ${next.departureDate}`,
          partySize: next.partySize,
          budget: budgetPlannerValues[next.budget],
          groupType: next.partySize === 2 ? "two travelers" : `${next.partySize} travelers`,
          stayingNear: "center Strip",
          vibe: "classic Vegas with one strong anchor, a useful meal, a free stop, and easy logistics",
          mealBudget: next.budget === "value" ? "Under $30 per person" : next.budget === "premium" ? "$120+ splurge meal" : "$30-$60 per person",
          pace: "Balanced",
          logistics: "Keep it walkable",
          prompt: "Build a geographically coherent Vegas trip with realistic timing and no unnecessary backtracking.",
        }),
      });
      if (!response.ok) throw new Error("Preview refresh failed");
      const nextResult = (await response.json()) as PlannerResponse;
      if (currentRequest === requestId.current) setResult(nextResult);
    } catch {
      if (currentRequest === requestId.current) setUpdateMessage("Keeping the current plan while live schedules refresh.");
    } finally {
      if (currentRequest === requestId.current) setUpdating(false);
    }
  }

  function updateDate(field: "arrivalDate" | "departureDate", value: string) {
    const next = { ...controls, [field]: value };
    if (field === "arrivalDate" && next.departureDate < value) next.departureDate = value;
    if (next.arrivalDate && next.departureDate) void regenerate(next, field);
    else setControls(next);
  }

  function handoffToPlanner() {
    setDates({ arrivalDate: controls.arrivalDate, departureDate: controls.departureDate });
    setSettings({ ...settings, partySize: controls.partySize });
    trackProductEvent("homepage_plan_refinement_started", {
      partySize: controls.partySize,
      budget: controls.budget,
    });
  }

  return (
    <section id="trip-builder" className="relative overflow-hidden px-4 pb-10 pt-5 sm:px-5 sm:pb-14 sm:pt-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(217,70,239,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_72%)]" />
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">A real Vegas plan, before you answer a thing</p>
          <h1 className="mt-2 text-3xl font-black leading-[1.04] text-white sm:mt-3 sm:text-5xl lg:text-6xl">See how your Vegas weekend fits together.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:mt-4 sm:text-lg sm:leading-7">Start with a useful plan. Change the dates, group size, or spend level, then refine the parts that matter to you.</p>
        </div>

        <div className="mt-4 rounded-lg border border-white/12 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 sm:mt-7 sm:p-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(17rem,1.6fr)_minmax(10rem,0.7fr)_minmax(10rem,0.8fr)_auto]">
            <div className="col-span-2 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/25 p-2 md:col-span-1">
              <label className="grid gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
                Arrival
                <input type="date" min={minDate} value={controls.arrivalDate} onChange={(event) => updateDate("arrivalDate", event.target.value)} className="min-h-10 min-w-0 rounded-md bg-white/10 px-2 text-sm font-bold normal-case tracking-normal text-white [color-scheme:dark]" />
              </label>
              <label className="grid gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
                Departure
                <input type="date" min={controls.arrivalDate || minDate} value={controls.departureDate} onChange={(event) => updateDate("departureDate", event.target.value)} className="min-h-10 min-w-0 rounded-md bg-white/10 px-2 text-sm font-bold normal-case tracking-normal text-white [color-scheme:dark]" />
              </label>
            </div>
            <label className="relative flex min-h-14 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 text-sm font-black text-white">
              <Users className="h-4 w-4 text-amber-100" />
              <select
                aria-label="Travelers"
                value={controls.partySize}
                onChange={(event) => void regenerate({ ...controls, partySize: Number(event.target.value) }, "partySize")}
                className="h-full min-w-0 flex-1 appearance-none bg-transparent outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 8].map((size) => <option key={size} value={size} className="bg-zinc-950">{size} traveler{size === 1 ? "" : "s"}</option>)}
              </select>
              <ChevronDown className="h-4 w-4 text-white/50" />
            </label>
            <label className="relative flex min-h-14 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 text-sm font-black text-white">
              <WalletCards className="h-4 w-4 text-amber-100" />
              <select
                aria-label="Budget"
                value={controls.budget}
                onChange={(event) => void regenerate({ ...controls, budget: event.target.value as HomePlanControls["budget"] }, "budget")}
                className="h-full min-w-0 flex-1 appearance-none bg-transparent outline-none"
              >
                {Object.entries(budgetLabels).map(([value, label]) => <option key={value} value={value} className="bg-zinc-950">{label}</option>)}
              </select>
              <ChevronDown className="h-4 w-4 text-white/50" />
            </label>
            <Link href={plannerHref} onClick={handoffToPlanner} className="col-span-2 inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-fuchsia-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:brightness-110 md:col-span-1">
              Plan this trip <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-white/50"><CalendarDays className="h-3.5 w-3.5" /> {formatDateRange(controls.arrivalDate, controls.departureDate)}</span>
            <span aria-live="polite" className={updateMessage ? "text-amber-100" : "text-emerald-200"}>{updating ? "Replanning around your changes..." : updateMessage || "Plan ready to refine"}</span>
          </div>
        </div>

        {firstDay ? (
          <div className={`mt-4 rounded-lg border border-white/12 bg-white/[0.055] p-3 transition sm:mt-5 sm:p-6 ${updating ? "opacity-65" : ""}`} data-testid="homepage-live-plan">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">Day 1 · {firstDay.label}</p>
                <h2 className="mt-1.5 text-lg font-black leading-tight text-white sm:mt-2 sm:text-3xl">{firstDay.theme}</h2>
              </div>
              <p className="hidden items-center gap-2 text-xs font-bold text-white/48 sm:inline-flex"><Sparkles className="h-4 w-4 text-fuchsia-300" /> Timed by the real planner engine</p>
            </div>
            <div className="mt-3 grid gap-2 sm:mt-4">
              {firstDay.blocks.map((block, index) => <PlanBlock key={`${block.time}-${block.title}`} block={block} previous={firstDay.blocks[index - 1]} />)}
            </div>

            {secondDay ? (
              <details className="mt-4 rounded-lg border border-white/10 bg-black/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.16em] text-amber-100">Day 2 · {secondDay.label}</span>
                    <span className="mt-1 block font-black text-white">{secondDay.theme}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-black text-white/55">Preview day 2 <ChevronDown className="h-4 w-4" /></span>
                </summary>
                <div className="border-t border-white/10 p-4">
                  <div className="grid gap-2">
                    {secondDay.blocks.map((block, index) => <PlanBlock key={`${block.time}-${block.title}`} block={block} previous={secondDay.blocks[index - 1]} />)}
                  </div>
                </div>
              </details>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold text-white/48">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-amber-100" /> Realistic duration and travel buffers</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-amber-100" /> Meals, free stops, and fixed events together</span>
        </div>
      </div>
    </section>
  );
}
