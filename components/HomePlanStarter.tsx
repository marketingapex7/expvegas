"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronDown, Users, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { trackProductEvent } from "@/lib/product-analytics";

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

function formatDateRange(arrivalDate: string, departureDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${formatter.format(new Date(`${arrivalDate}T12:00:00`))} - ${formatter.format(new Date(`${departureDate}T12:00:00`))}`;
}

export function HomePlanStarter({
  initialControls,
  minDate,
}: {
  initialControls: HomePlanControls;
  minDate: string;
}) {
  const { setDates, setSettings, settings } = useTripSelections();
  const [controls, setControls] = useState(initialControls);
  const [hasCustomized, setHasCustomized] = useState(false);
  const plannerHref = useMemo(
    () => `/planner?refine=1&arrival=${controls.arrivalDate}&departure=${controls.departureDate}&budget=${controls.budget}`,
    [controls.arrivalDate, controls.budget, controls.departureDate],
  );

  function updateControls(next: HomePlanControls, changed: keyof HomePlanControls) {
    setControls(next);
    setHasCustomized(true);
    trackProductEvent("homepage_plan_control_changed", { control: changed });
  }

  function updateDate(field: "arrivalDate" | "departureDate", value: string) {
    const next = { ...controls, [field]: value };
    if (field === "arrivalDate" && next.departureDate < value) next.departureDate = value;
    updateControls(next, field);
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
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Personalized Las Vegas itinerary</p>
          <h1 className="mt-2 text-3xl font-black leading-[1.04] text-white sm:mt-3 sm:text-5xl lg:text-6xl">Start with your dates. Build the trip around you.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:mt-4 sm:text-lg sm:leading-7">
            Choose your dates, travelers, and budget. Next, tell us what matters before anything is planned.
          </p>
        </div>

        <div data-testid="homepage-plan-starter" className="mt-5 rounded-lg border border-white/12 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 sm:mt-7 sm:p-4">
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
                onChange={(event) => updateControls({ ...controls, partySize: Number(event.target.value) }, "partySize")}
                className="h-full min-w-0 flex-1 appearance-none bg-transparent outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 8].map((size) => <option key={size} value={size} className="bg-zinc-950">{size} traveler{size === 1 ? "" : "s"}</option>)}
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-white/50" />
            </label>
            <label className="relative flex min-h-14 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 text-sm font-black text-white">
              <WalletCards className="h-4 w-4 text-amber-100" />
              <select
                aria-label="Budget"
                value={controls.budget}
                onChange={(event) => updateControls({ ...controls, budget: event.target.value as HomePlanControls["budget"] }, "budget")}
                className="h-full min-w-0 flex-1 appearance-none bg-transparent outline-none"
              >
                {Object.entries(budgetLabels).map(([value, label]) => <option key={value} value={value} className="bg-zinc-950">{label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-white/50" />
            </label>
            <Link href={plannerHref} onClick={handoffToPlanner} className="col-span-2 inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-fuchsia-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:brightness-110 md:col-span-1">
              Continue to trip options <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-white/50"><CalendarDays className="h-3.5 w-3.5" /> {formatDateRange(controls.arrivalDate, controls.departureDate)}</span>
            <span aria-live="polite" className="text-emerald-200">{hasCustomized ? "Selections updated" : "Ready for trip options"}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-bold text-white/48">No itinerary is created until you review the trip options and choose to build it.</p>
      </div>
    </section>
  );
}
