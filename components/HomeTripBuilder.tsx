"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, ChevronDown, Clock3, Loader2, MapPin, Users, WalletCards } from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { mixedSelectionText, preferenceOptions, toggleGamblingSelection } from "@/lib/planner-preferences";
import { trackProductEvent } from "@/lib/product-analytics";
import { PlannerInput, PlannerResponse } from "@/types/planner";

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
 * What the engine is told when a question is left unanswered. Every value is
 * replaced the moment the visitor picks the matching option, so skipping a step
 * still produces a coherent trip rather than an underspecified request.
 */
const unansweredDefaults = {
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
    stayingNear: preferences.stayingNear[0] || unansweredDefaults.stayingNear,
    vibe: preferences.vibe[0] || unansweredDefaults.vibe,
    foodPreference: preferences.foodPreference.join(", ") || undefined,
    mealBudget: mixedSelectionText("meal", preferences.mealBudget) || budgetMealDefaults[controls.budget],
    gamblingPreference: mixedSelectionText("gambling", preferences.gamblingPreference),
    pace: preferences.pace[0] || unansweredDefaults.pace,
    logistics: preferences.logistics[0] || unansweredDefaults.logistics,
    additionalDetails: additionalDetails.trim().slice(0, 1_500) || undefined,
    prompt: unansweredDefaults.prompt,
  };
}

function formatDateRange(arrivalDate: string, departureDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${formatter.format(new Date(`${arrivalDate}T12:00:00`))} - ${formatter.format(new Date(`${departureDate}T12:00:00`))}`;
}

function StepPanel({
  step,
  title,
  description,
  testId,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <div data-testid={testId} className="mt-4 rounded-lg border border-white/12 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 sm:mt-5 sm:p-6">
      <div className="flex items-start gap-3 border-b border-white/10 pb-4 sm:gap-4">
        {/* Decorative only: the heading beside it already reads "Step N", so
            announcing the numeral again would just repeat it to a screen reader. */}
        <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xl font-black text-black sm:h-14 sm:w-14 sm:text-3xl">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-black leading-tight text-white sm:text-3xl">
            <span className="text-amber-100">Step {step}:</span> {title}
          </h2>
          {description ? <p className="mt-1.5 text-sm leading-6 text-white/60 sm:text-base">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
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
              className={`group/option inline-flex min-h-11 items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm font-bold leading-5 shadow-sm transition ${
                isSelected
                  ? "border-amber-100 bg-amber-200 text-zinc-950 shadow-[0_7px_18px_rgba(251,191,36,0.16)]"
                  : "border-white/14 bg-black/25 text-white/80 hover:border-amber-100/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition ${
                  isSelected
                    ? "border-zinc-950/30 bg-zinc-950 text-amber-100"
                    : "border-white/25 bg-white/[0.04] group-hover/option:border-amber-100/60"
                }`}
              >
                {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HomeTripBuilder({
  initialControls,
  minDate,
}: {
  initialControls: HomePlanControls;
  minDate: string;
}) {
  const router = useRouter();
  const { setDates, setSettings, settings } = useTripSelections();
  const [controls, setControls] = useState(initialControls);
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState("");

  function updateControls(next: HomePlanControls, changed: keyof HomePlanControls) {
    setControls(next);
    trackProductEvent("homepage_plan_control_changed", { control: changed });
  }

  function updateDate(field: "arrivalDate" | "departureDate", value: string) {
    const next = { ...controls, [field]: value };
    if (field === "arrivalDate" && next.departureDate < value) next.departureDate = value;
    updateControls(next, field);
  }

  function togglePreference(key: PreferenceKey, option: string, multi: boolean) {
    setPreferences((current) => {
      const values = current[key];

      if (!multi) return { ...current, [key]: values[0] === option ? [] : [option] };
      if (key === "gamblingPreference") return { ...current, [key]: toggleGamblingSelection(values, option) };

      return {
        ...current,
        [key]: values.includes(option) ? values.filter((value) => value !== option) : [...values, option],
      };
    });
    trackProductEvent("homepage_plan_control_changed", { control: key });
  }

  async function createItinerary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (building) return;

    setBuilding(true);
    setBuildError("");
    setDates({ arrivalDate: controls.arrivalDate, departureDate: controls.departureDate });
    setSettings({ ...settings, partySize: controls.partySize });

    const payload = plannerPayload(controls, preferences, additionalDetails);
    trackProductEvent("homepage_itinerary_requested", {
      partySize: controls.partySize,
      budget: controls.budget,
    });

    try {
      const planResponse = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!planResponse.ok) throw new Error("Itinerary build failed");

      const result = (await planResponse.json()) as PlannerResponse;
      const saveResponse = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: payload, result }),
      });
      const saved = saveResponse.ok ? ((await saveResponse.json()) as { shareToken?: string }) : null;

      if (saved?.shareToken) {
        window.localStorage.setItem("experiencevegas:lastPlanToken", saved.shareToken);
        router.push(`/plan/${saved.shareToken}`);
        // Left in its loading state on purpose: the page is on its way out, and
        // flipping the button back reads as the build having finished here.
        return;
      }

      // The itinerary built, but only a saved plan has somewhere to be shown.
      // Nothing on this page can display it, so this is a real dead end.
      setBuildError("We built your itinerary but could not save it. Try once more.");
    } catch {
      setBuildError("We could not build your itinerary just now. Try once more in a moment.");
    }

    setBuilding(false);
  }

  return (
    <section id="trip-builder" className="relative overflow-hidden px-4 pb-10 pt-5 sm:px-5 sm:pb-14 sm:pt-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(217,70,239,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_72%)]" />
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Personalized Las Vegas itinerary</p>
          <h1 className="mt-2 text-3xl font-black leading-[1.04] text-white sm:mt-3 sm:text-5xl lg:text-6xl">Build your Las Vegas itinerary.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:mt-4 sm:text-lg sm:leading-7">
            Answer three quick steps. We turn them into a timed plan with events, food, free stops, casino time, and realistic travel buffers.
          </p>
        </div>

        <form onSubmit={createItinerary}>
          <StepPanel step={1} testId="home-step-one" title="Pick your dates" description="Plans cover arrival through the day before departure.">
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-[minmax(17rem,1.6fr)_minmax(10rem,0.7fr)_minmax(10rem,0.8fr)]">
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
            </div>
            <p data-testid="home-date-range" className="mt-3 inline-flex items-center gap-2 px-1 text-xs font-bold text-white/50">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDateRange(controls.arrivalDate, controls.departureDate)}
            </p>
          </StepPanel>

          <StepPanel
            step={2}
            testId="home-step-two"
            title="Tell us about the trip"
            description="Who is going, where you are staying, and what you are here for."
          >
            <div className="mt-4 grid gap-3 md:grid-cols-3">
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
          </StepPanel>

          <StepPanel
            step={3}
            testId="home-step-three"
            title="Tune the plan"
            description="A few quick choices make the itinerary much better. Skip anything you do not care about."
          >
            <div className="mt-4 grid gap-3 md:grid-cols-3">
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
          </StepPanel>

          <div className="mt-4 rounded-lg border border-white/12 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 sm:mt-5 sm:p-6">
            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={building}
                data-testid="home-create-itinerary"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-fuchsia-300 px-6 py-3 text-base font-black text-zinc-950 shadow-lg shadow-fuchsia-950/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-72 sm:text-lg"
              >
                {building ? "Creating your itinerary..." : "Create my Itinerary"}
                {building ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              </button>
              <p aria-live="polite" className="min-h-5 text-center text-sm font-bold text-white/50">
                {building
                  ? "Checking live schedules and timing the days. This takes a few seconds."
                  : "Everything above is optional except your dates."}
              </p>
            </div>
            {buildError ? <p role="alert" className="mt-3 text-center text-sm font-bold text-amber-100">{buildError}</p> : null}
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold text-white/48">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-amber-100" /> Realistic duration and travel buffers</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-amber-100" /> Meals, free stops, and fixed events together</span>
        </div>
      </div>
    </section>
  );
}
