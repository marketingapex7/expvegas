"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, ChevronDown, Clock3, Loader2, MapPin, Route, Sparkles, Users, WalletCards } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { mixedSelectionText, preferenceOptions, toggleGamblingSelection } from "@/lib/planner-preferences";
import { trackProductEvent } from "@/lib/product-analytics";
import { estimateVegasTravel } from "@/lib/vegas-logistics";
import { ItineraryBlock, PlannerInput, PlannerResponse } from "@/types/planner";

type HomePlanControls = {
  arrivalDate: string;
  departureDate: string;
  partySize: number;
  budget: "value" | "mid" | "premium";
};

type PreferenceKey =
  | "groupType"
  | "stayingNear"
  | "vibe"
  | "foodPreference"
  | "mealBudget"
  | "pace"
  | "gamblingPreference"
  | "logistics";

type PreferenceGroupDefinition = {
  label: string;
  key: PreferenceKey;
  multi: boolean;
  options: readonly string[];
};

/**
 * Ticket budget is deliberately missing from step 2: the budget select in step 1
 * already sets it, and two controls for one field read as a bug.
 */
const tripDetailGroups: PreferenceGroupDefinition[] = [
  { label: "Group", key: "groupType", multi: false, options: preferenceOptions.group },
  { label: "Lodging", key: "stayingNear", multi: false, options: preferenceOptions.lodging },
  { label: "Vibe", key: "vibe", multi: false, options: preferenceOptions.vibe },
];

const tuningGroups: PreferenceGroupDefinition[] = [
  { label: "Food", key: "foodPreference", multi: true, options: preferenceOptions.food },
  { label: "Food spend", key: "mealBudget", multi: true, options: preferenceOptions.foodSpend },
  { label: "Pace", key: "pace", multi: false, options: preferenceOptions.pace },
];

const optionalGroups: PreferenceGroupDefinition[] = [
  { label: "Gambling bankroll", key: "gamblingPreference", multi: true, options: preferenceOptions.gambling },
  { label: "Logistics", key: "logistics", multi: false, options: preferenceOptions.logistics },
];

const emptyPreferences: Record<PreferenceKey, string[]> = {
  groupType: [],
  stayingNear: [],
  vibe: [],
  foodPreference: [],
  mealBudget: [],
  pace: [],
  gamblingPreference: [],
  logistics: [],
};

/**
 * The assumptions the sample plan is built on. Each is replaced the moment the
 * visitor picks the matching option, so an untouched homepage still asks the
 * engine for exactly the plan it asked for before the steps moved onto it.
 */
const sampleDefaults = {
  stayingNear: "center Strip",
  vibe: "classic Vegas with one strong anchor, a useful meal, a free stop, and easy logistics",
  pace: "Balanced",
  logistics: "Keep it walkable",
  prompt: "Build a geographically coherent Vegas trip with realistic timing and no unnecessary backtracking.",
};

const budgetMealDefaults = {
  value: "Under $30 per person",
  mid: "$30-$60 per person",
  premium: "$120+ splurge meal",
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

function plannerPayload(
  controls: HomePlanControls,
  preferences: Record<PreferenceKey, string[]>,
  additionalDetails: string,
): PlannerInput {
  return {
    travelDates: `${controls.arrivalDate} to ${controls.departureDate}`,
    partySize: controls.partySize,
    budget: budgetPlannerValues[controls.budget],
    groupType: preferences.groupType[0] || (controls.partySize === 2 ? "two travelers" : `${controls.partySize} travelers`),
    stayingNear: preferences.stayingNear[0] || sampleDefaults.stayingNear,
    vibe: preferences.vibe[0] || sampleDefaults.vibe,
    foodPreference: preferences.foodPreference.join(", ") || undefined,
    mealBudget: mixedSelectionText("meal", preferences.mealBudget) || budgetMealDefaults[controls.budget],
    gamblingPreference: mixedSelectionText("gambling", preferences.gamblingPreference),
    pace: preferences.pace[0] || sampleDefaults.pace,
    logistics: preferences.logistics[0] || sampleDefaults.logistics,
    additionalDetails: additionalDetails.trim().slice(0, 1_500) || undefined,
    prompt: sampleDefaults.prompt,
  };
}

function PreferenceGroup({
  label,
  multi,
  options,
  selected,
  onToggle,
}: {
  label: string;
  multi: boolean;
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className="mb-2 mt-1 text-[11px] font-semibold text-white/45">{multi ? "Choose all that fit." : "Choose one."}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={isSelected}
              className={`min-h-9 rounded-full px-3 py-2 text-left text-xs font-bold leading-5 transition ${
                isSelected ? "bg-amber-200 text-black" : "bg-white/10 text-white/72 hover:bg-white/15"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const router = useRouter();
  const { setDates, setSettings, settings } = useTripSelections();
  const [controls, setControls] = useState(initialControls);
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [result, setResult] = useState(initialResult);
  const [updating, setUpdating] = useState(false);
  const [hasCustomized, setHasCustomized] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState("");
  const requestId = useRef(0);
  const preferencesTouched = useRef(false);

  const firstDay = result.itineraryDays?.[0];
  const secondDay = result.itineraryDays?.[1];

  useEffect(() => {
    trackProductEvent("homepage_plan_preview_rendered", {
      days: result.itineraryDays?.length || 0,
      live: result.sourceSummary?.startsWith("Live") || false,
    });
  }, [result.itineraryDays?.length, result.sourceSummary]);

  async function refreshPreview(payload: PlannerInput, changed: string) {
    setHasCustomized(true);
    setUpdating(true);
    setUpdateMessage("");
    const currentRequest = ++requestId.current;
    trackProductEvent("homepage_plan_control_changed", { control: changed });

    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // Chips get clicked in bursts, so the preview waits for the burst to finish
  // rather than asking the engine for a whole new plan on every tap. The
  // free-text box is left out on purpose: typing should not fire requests.
  useEffect(() => {
    if (!preferencesTouched.current) return;

    const timer = window.setTimeout(() => {
      void refreshPreview(plannerPayload(controls, preferences, ""), "preferences");
    }, 500);

    return () => window.clearTimeout(timer);
    // Date and travelers changes refresh the preview themselves; listing controls
    // here would fire a second request for the same single change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences]);

  function updateControls(next: HomePlanControls, changed: keyof HomePlanControls) {
    setControls(next);
    void refreshPreview(plannerPayload(next, preferences, ""), changed);
  }

  function updateDate(field: "arrivalDate" | "departureDate", value: string) {
    const next = { ...controls, [field]: value };
    if (field === "arrivalDate" && next.departureDate < value) next.departureDate = value;
    if (next.arrivalDate && next.departureDate) updateControls(next, field);
    else setControls(next);
  }

  function togglePreference(key: PreferenceKey, option: string, multi: boolean) {
    preferencesTouched.current = true;
    setPreferences((current) => {
      const values = current[key];

      if (!multi) return { ...current, [key]: values[0] === option ? [] : [option] };
      if (key === "gamblingPreference") return { ...current, [key]: toggleGamblingSelection(values, option) };

      return {
        ...current,
        [key]: values.includes(option) ? values.filter((value) => value !== option) : [...values, option],
      };
    });
  }

  async function buildFullPlan() {
    setBuilding(true);
    setBuildError("");
    setDates({ arrivalDate: controls.arrivalDate, departureDate: controls.departureDate });
    setSettings({ ...settings, partySize: controls.partySize });

    const payload = plannerPayload(controls, preferences, additionalDetails);
    trackProductEvent("homepage_plan_build_started", {
      partySize: controls.partySize,
      budget: controls.budget,
    });

    try {
      const planResponse = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!planResponse.ok) throw new Error("Plan build failed");

      const nextResult = (await planResponse.json()) as PlannerResponse;
      setResult(nextResult);
      setHasCustomized(true);

      const saveResponse = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: payload, result: nextResult }),
      });
      const saved = saveResponse.ok ? ((await saveResponse.json()) as { shareToken?: string }) : null;

      if (saved?.shareToken) {
        window.localStorage.setItem("experiencevegas:lastPlanToken", saved.shareToken);
        router.push(`/plan/${saved.shareToken}`);
        // Leaving the button in its loading state: the page is on its way out,
        // and flipping it back reads as the build having finished here.
        return;
      }

      // Only the shareable link failed. The plan above is the real one now, so
      // say that instead of implying the build itself did not happen.
      setBuildError("Your plan is ready above, but we could not save a shareable link for it.");
    } catch {
      setBuildError("We could not build the full plan just now. The preview above is still current.");
    }

    setBuilding(false);
  }

  return (
    <section id="trip-builder" className="relative overflow-hidden px-4 pb-10 pt-5 sm:px-5 sm:pb-14 sm:pt-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(217,70,239,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_72%)]" />
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Sample Vegas weekend - ready to customize</p>
          <h1 className="mt-2 text-3xl font-black leading-[1.04] text-white sm:mt-3 sm:text-5xl lg:text-6xl">Start with a Vegas weekend that already fits together.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:mt-4 sm:text-lg sm:leading-7">Use this sample as a starting point. Change the dates, group size, or spend level, then refine the parts that matter to you.</p>
        </div>

        <div className="mt-4 rounded-lg border border-white/12 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 sm:mt-7 sm:p-4">
          <p className="mb-2 inline-flex items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
            <CalendarDays className="h-4 w-4" /> Step 1: Pick your dates
          </p>
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
            {/* The select is stretched over the whole control and the icons sit on top
                of it as pointer-transparent overlays. Laid out beside the select they
                ate the click instead: a label forwards a click to a select as focus
                only, so hitting the chevron never opened the menu. Anything short of
                full coverage leaves the same dead zone, hence inset-0 rather than a
                height the surrounding grid row can outgrow. */}
            <label className="relative block min-h-14 min-w-0 rounded-lg border border-white/10 bg-black/25 text-sm font-black text-white focus-within:border-amber-100/70">
              <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-100" />
              <select
                aria-label="Travelers"
                value={controls.partySize}
                onChange={(event) => updateControls({ ...controls, partySize: Number(event.target.value) }, "partySize")}
                className="absolute inset-0 h-full w-full appearance-none bg-transparent pl-9 pr-9 outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 8].map((size) => <option key={size} value={size} className="bg-zinc-950">{size} traveler{size === 1 ? "" : "s"}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            </label>
            <label className="relative block min-h-14 min-w-0 rounded-lg border border-white/10 bg-black/25 text-sm font-black text-white focus-within:border-amber-100/70">
              <WalletCards className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-100" />
              <select
                aria-label="Budget"
                value={controls.budget}
                onChange={(event) => updateControls({ ...controls, budget: event.target.value as HomePlanControls["budget"] }, "budget")}
                className="absolute inset-0 h-full w-full appearance-none bg-transparent pl-9 pr-9 outline-none"
              >
                {Object.entries(budgetLabels).map(([value, label]) => <option key={value} value={value} className="bg-zinc-950">{label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            </label>
            <button
              type="button"
              onClick={() => void buildFullPlan()}
              disabled={building}
              data-testid="home-build-plan-top"
              className="col-span-2 inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-fuchsia-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70 md:col-span-1"
            >
              {building ? "Building..." : "Build my plan"} {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold">
            <span className="inline-flex items-center gap-2 text-white/50"><CalendarDays className="h-3.5 w-3.5" /> {formatDateRange(controls.arrivalDate, controls.departureDate)}</span>
            <span aria-live="polite" className={updateMessage ? "text-amber-100" : "text-emerald-200"}>{updating ? "Replanning around your changes..." : updateMessage || (hasCustomized ? "Your plan is ready" : "Sample plan ready to customize")}</span>
          </div>
        </div>

        {firstDay ? (
          <div className={`mt-4 rounded-lg border border-white/12 bg-white/[0.055] p-3 transition sm:mt-5 sm:p-6 ${updating ? "opacity-65" : ""}`} data-testid="homepage-live-plan">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">Day 1 / {firstDay.label}</p>
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
                    <span className="block text-xs font-black uppercase tracking-[0.16em] text-amber-100">Day 2 / {secondDay.label}</span>
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

        <div data-testid="home-step-two" className="mt-4 rounded-lg border border-white/12 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 sm:mt-5 sm:p-6">
          <div className="border-b border-white/10 pb-3">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
              <Users className="h-4 w-4" /> Step 2: Tell us about the trip
            </p>
            <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">Who is going, and what are you here for?</h2>
            <p className="mt-1.5 text-sm leading-6 text-white/60">Anything you skip keeps the sample&apos;s assumption. The plan above rebuilds as you choose.</p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {tripDetailGroups.map((group) => (
              <PreferenceGroup
                key={group.key}
                label={group.label}
                multi={group.multi}
                options={group.options}
                selected={preferences[group.key]}
                onToggle={(option) => togglePreference(group.key, option, group.multi)}
              />
            ))}
          </div>
        </div>

        <div data-testid="home-step-three" className="mt-4 rounded-lg border border-white/12 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 sm:mt-5 sm:p-6">
          <div className="border-b border-white/10 pb-3">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
              <Sparkles className="h-4 w-4" /> Step 3: Tune the plan
            </p>
            <h2 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">A few quick choices make the plan much better.</h2>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {tuningGroups.map((group) => (
              <PreferenceGroup
                key={group.key}
                label={group.label}
                multi={group.multi}
                options={group.options}
                selected={preferences[group.key]}
                onToggle={(option) => togglePreference(group.key, option, group.multi)}
              />
            ))}
          </div>

          <details className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <summary className="cursor-pointer text-sm font-black text-white/70">Optional gambling and logistics preferences</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {optionalGroups.map((group) => (
                <PreferenceGroup
                  key={group.key}
                  label={group.label}
                  multi={group.multi}
                  options={group.options}
                  selected={preferences[group.key]}
                  onToggle={(option) => togglePreference(group.key, option, group.multi)}
                />
              ))}
            </div>
          </details>

          <label className="mt-4 grid gap-2 text-sm font-bold text-white/70">
            Anything else we should know?
            <textarea
              value={additionalDetails}
              onChange={(event) => setAdditionalDetails(event.target.value)}
              className="min-h-20 resize-none rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-amber-100/70"
              placeholder="Dietary restrictions, must-see restaurants, no late nights, celebrating a birthday..."
            />
          </label>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-white/45">
              {/* The preview only ever covers the opening day or two. Saying so keeps
                  the final button from looking like a no-op once a plan is on screen. */}
              Building saves the full trip and opens it on its own page.
            </p>
            <button
              type="button"
              onClick={() => void buildFullPlan()}
              disabled={building}
              data-testid="home-build-plan"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-fuchsia-300 px-5 py-3 font-black text-zinc-950 shadow-lg shadow-fuchsia-950/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70 sm:min-w-56"
            >
              {building ? "Building your plan..." : "Build my plan"} {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
          {buildError ? <p role="alert" className="mt-3 text-sm font-bold text-amber-100">{buildError}</p> : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold text-white/48">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-amber-100" /> Realistic duration and travel buffers</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-amber-100" /> Meals, free stops, and fixed events together</span>
        </div>
      </div>
    </section>
  );
}
