"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Loader2, MapPin, Sparkles, Users, WalletCards } from "lucide-react";
import { PlannerInput, PlannerResponse } from "@/types/planner";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { DateRangeFields } from "@/components/DateRangeFields";

const PlanResult = dynamic(
  () => import("@/components/PlanResult").then((module) => module.PlanResult),
  { ssr: false },
);

const tuneOptions = [
  { label: "Make cheaper", updates: { mealBudget: "Mostly casual meals under $40 per person", budget: "event tickets under $100 per person" } },
  { label: "More premium", updates: { mealBudget: "One premium dinner over $100 per person", budget: "premium event tickets are okay if worth it" } },
  { label: "Less walking", updates: { logistics: "Keep it walkable" } },
  { label: "More food-focused", updates: { mealBudget: "Food is a big part at $80-$150 per person" } },
  { label: "More gambling", updates: { gamblingPreference: "Table games bankroll $300+ total" } },
  { label: "No gambling", updates: { gamblingPreference: "No gambling" } },
  { label: "Family-friendly", updates: { pace: "Family-friendly pace", groupType: "family with teens" } },
];

const refinementGroups = [
  {
    label: "Food",
    key: "foodPreference",
    multi: true,
    options: ["Steakhouse", "Buffet", "Celebrity chef", "Casual and fast", "Italian", "Asian", "Mexican", "Cheap eats", "Surprise me"],
  },
  {
    label: "Food spend",
    key: "mealBudget",
    multi: true,
    options: ["Under $30 per person", "$30-$60 per person", "$60-$120 per person", "$120+ splurge meal"],
  },
  {
    label: "Gambling bankroll",
    key: "gamblingPreference",
    multi: true,
    options: ["No gambling", "Casino atmosphere only", "Bankroll under $100", "Bankroll $100-$300", "Bankroll $300-$750", "Bankroll $750+", "Slots", "Table games", "Poker", "Sportsbook"],
  },
  {
    label: "Pace",
    key: "pace",
    multi: false,
    options: ["Packed schedule", "Balanced", "Slow mornings", "Late nights", "Family-friendly pace"],
  },
  {
    label: "Logistics",
    key: "logistics",
    multi: false,
    options: ["Keep it walkable", "Rideshares are fine", "Stay near hotel", "Avoid long lines"],
  },
] as const;

const helperGroups = [
  {
    label: "Ticket budget",
    icon: WalletCards,
    multi: true,
    options: ["Under $100 per person", "$100-$200 per person", "$200-$350 per person", "$350+ splurge"],
  },
  {
    label: "Group",
    icon: Users,
    multi: false,
    options: ["couple", "friends trip", "family with teens", "bachelor party"],
  },
  {
    label: "Lodging",
    icon: MapPin,
    multi: false,
    options: ["haven't booked lodging yet", "center Strip", "near Bellagio", "near Caesars", "near Sphere", "near T-Mobile Arena", "Downtown"],
  },
  {
    label: "Vibe",
    icon: Sparkles,
    multi: false,
    options: ["big Vegas spectacle", "easy laughs", "sports energy", "not too touristy"],
  },
];

const starterPrompt =
  "We want a memorable Vegas night with one strong anchor, easy logistics, and something that feels worth booking.";

function formatTravelDate(value: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function addDays(value: string, days: number) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function tripLengthInDays(arrival: string, departure: string) {
  if (!arrival || !departure) return 0;
  return Math.round((Date.parse(`${departure}T00:00:00Z`) - Date.parse(`${arrival}T00:00:00Z`)) / 86_400_000);
}

function sentenceFor(group: string, option: string) {
  if (group === "Ticket budget") return `Ticket budget: ${option}.`;
  if (group === "Group") return `Group: ${option}.`;
  if (group === "Lodging") {
    return option.includes("haven't booked") ? "Lodging: not booked yet." : `Lodging: near ${option}.`;
  }
  return `Vibe: ${option}.`;
}

function mixedSelectionText(kind: "ticket" | "meal" | "gambling", values: string[]) {
  if (values.length === 0) return undefined;
  if (kind === "gambling" && values.length === 1 && values[0] === "No gambling") return "No gambling";
  if (kind === "gambling" && values.length === 1 && values[0] === "Casino atmosphere only") {
    return "Casino atmosphere only, with no gambling bankroll";
  }

  const label = kind === "ticket" ? "ticket options" : kind === "meal" ? "meals" : "gambling preferences";
  return `Mix ${label} across ${values.join(" and ")}; include choices from each selection when available`;
}

function upsertPromptSentence(current: string, label: string, sentence: string) {
  const trimmed = current.trim();
  const pattern = new RegExp(`${label}: [^.]*\\.`);

  if (pattern.test(trimmed)) {
    return trimmed.replace(pattern, sentence).replace(/\s{2,}/g, " ").trim();
  }

  if (!sentence) return trimmed;
  return trimmed.length > 0 ? `${trimmed} ${sentence}` : sentence;
}

export function HeroPlanner({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const {
    items: tripPicks,
    dates: savedTripDates,
    settings: tripSettings,
    hydrated: tripSelectionsHydrated,
    setDates: setSavedTripDates,
    setSettings: setTripSettings,
  } = useTripSelections();
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);
  const [result, setResult] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRefinements, setShowRefinements] = useState(false);
  const [refinements, setRefinements] = useState<Record<string, string>>({});
  const [multiRefinements, setMultiRefinements] = useState<Record<string, string[]>>({});
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [savedPlanToken, setSavedPlanToken] = useState("");
  const [savedPlanExpiresAt, setSavedPlanExpiresAt] = useState("");
  const [savedPlanFound, setSavedPlanFound] = useState(false);
  const [planInput, setPlanInput] = useState<PlannerInput | null>(null);
  const [email, setEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [buildProgress, setBuildProgress] = useState(8);
  const [buildStepIndex, setBuildStepIndex] = useState(0);
  const [dateError, setDateError] = useState("");
  const [dateFieldsTouched, setDateFieldsTouched] = useState({ arrival: false, departure: false });
  const buildPanelRef = useRef<HTMLDivElement>(null);
  const dateDraftEditedRef = useRef(false);
  const today = new Date().toISOString().slice(0, 10);
  const maxDepartureDate = addDays(arrivalDate, 7);
  const arrivalError = !arrivalDate
    ? "Choose your arrival date."
    : arrivalDate < today
      ? "Arrival must be today or later so we can use current schedules."
      : "";
  const departureError = !departureDate
    ? "Choose your departure date."
    : arrivalDate && departureDate < arrivalDate
      ? "Departure must be on or after arrival."
      : tripLengthInDays(arrivalDate, departureDate) > 7
        ? "Departure must be within 7 planning days of arrival."
        : "";
  const datesAreSet = !arrivalError && !departureError;
  const plannerCtaState = loading ? "loading" : !datesAreSet ? "disabled" : saveStatus ? "error" : "ready";

  const helperSummary = useMemo(() => {
    if (selectedHelpers.length === 0) return "Add dates, ticket budget, group, lodging, and vibe when you know them.";
    return `${selectedHelpers.length} detail${selectedHelpers.length === 1 ? "" : "s"} added to your request.`;
  }, [selectedHelpers.length]);

  function addHelper(group: string, option: string) {
    const key = `${group}:${option}`;
    const isMulti = helperGroups.find((helperGroup) => helperGroup.label === group)?.multi;
    const groupSelections = selectedHelpers.filter((helper) => helper.startsWith(`${group}:`));
    const nextGroupSelections = isMulti
      ? groupSelections.includes(key)
        ? groupSelections.filter((helper) => helper !== key)
        : [...groupSelections, key]
      : [key];

    setSelectedHelpers([
      ...selectedHelpers.filter((helper) => !helper.startsWith(`${group}:`)),
      ...nextGroupSelections,
    ]);
    setPrompt((current) => {
      const values = nextGroupSelections.map((helper) => helper.split(":").slice(1).join(":"));
      const nextSentence =
        group === "Ticket budget"
          ? values.length > 0
            ? `Ticket budget: ${mixedSelectionText("ticket", values)}.`
            : ""
          : sentenceFor(group, option);
      return upsertPromptSentence(current, group === "Ticket budget" ? "Ticket budget" : group, nextSentence);
    });
  }

  function updateTravelDates(nextArrivalDate: string, nextDepartureDate: string) {
    dateDraftEditedRef.current = true;
    setArrivalDate(nextArrivalDate);
    setDepartureDate(nextDepartureDate);
    setSavedTripDates({ arrivalDate: nextArrivalDate, departureDate: nextDepartureDate });
    if (nextArrivalDate && nextDepartureDate && nextDepartureDate < nextArrivalDate) {
      setDateError("Your departure date must be on or after your arrival date.");
    } else if (tripLengthInDays(nextArrivalDate, nextDepartureDate) > 7) {
      setDateError("Choose a trip of 7 planning days or fewer.");
    } else if (nextArrivalDate && nextArrivalDate < today) {
      setDateError("Choose an arrival date from today forward so we can use current schedules.");
    } else {
      setDateError("");
    }

    const formattedArrival = formatTravelDate(nextArrivalDate);
    const formattedDeparture = formatTravelDate(nextDepartureDate);

    if (!formattedArrival && !formattedDeparture) return;

    const dateText =
      formattedArrival && formattedDeparture
        ? `${formattedArrival} to ${formattedDeparture}`
        : formattedArrival || formattedDeparture;

    setSelectedHelpers((current) => (current.includes("Dates:calendar") ? current : [...current, "Dates:calendar"]));
    setPrompt((current) => upsertPromptSentence(current, "Dates", `Dates: ${dateText}.`));
  }

  function loadSampleTrip() {
    const nextFriday = new Date();
    const daysUntilFriday = (5 - nextFriday.getUTCDay() + 7) % 7;
    nextFriday.setUTCDate(nextFriday.getUTCDate() + (daysUntilFriday < 3 ? daysUntilFriday + 7 : daysUntilFriday));
    const nextMonday = new Date(nextFriday);
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 3);
    const nextArrival = nextFriday.toISOString().slice(0, 10);
    const nextDeparture = nextMonday.toISOString().slice(0, 10);
    const dateText = `${formatTravelDate(nextArrival)} to ${formatTravelDate(nextDeparture)}`;

    dateDraftEditedRef.current = true;
    setArrivalDate(nextArrival);
    setDepartureDate(nextDeparture);
    setSavedTripDates({ arrivalDate: nextArrival, departureDate: nextDeparture });
    setTripSettings({ ...tripSettings, partySize: 4, budgetCap: 2_000 });
    setSelectedHelpers([
      "Dates:calendar",
      "Ticket budget:Under $100 per person",
      "Ticket budget:$100-$200 per person",
      "Group:friends trip",
      "Lodging:haven't booked lodging yet",
      "Vibe:big Vegas spectacle",
    ]);
    setPrompt(
      `Dates: ${dateText}. Ticket budget: mix ticket options across Under $100 per person and $100-$200 per person. Group: friends trip. Lodging: not booked yet. Vibe: big Vegas spectacle with one standout dinner and flexible daytime stops.`,
    );
    setDateError("");
    setDateFieldsTouched({ arrival: false, departure: false });
  }

  function selectedValue(label: string) {
    return selectedHelpers.find((helper) => helper.startsWith(`${label}:`))?.split(":").slice(1).join(":");
  }

  function selectedValues(label: string) {
    return selectedHelpers
      .filter((helper) => helper.startsWith(`${label}:`))
      .map((helper) => helper.split(":").slice(1).join(":"));
  }

  const shareUrl =
    savedPlanToken && typeof window !== "undefined" ? `${window.location.origin}/plan/${savedPlanToken}` : undefined;

  const loadingPayload = planInput || buildPlannerPayload();
  const loadingDates = loadingPayload.travelDates || "dates flexible";
  const loadingSelections = [
    loadingPayload.groupType ? `Group: ${loadingPayload.groupType}` : undefined,
    loadingPayload.stayingNear ? `Lodging: ${loadingPayload.stayingNear}` : undefined,
    loadingPayload.budget ? `Tickets: ${loadingPayload.budget}` : undefined,
    loadingPayload.mealBudget ? `Food: ${loadingPayload.mealBudget}` : undefined,
    loadingPayload.gamblingPreference ? `Gambling: ${loadingPayload.gamblingPreference}` : undefined,
    loadingPayload.pace ? `Pace: ${loadingPayload.pace}` : undefined,
    loadingPayload.logistics ? `Logistics: ${loadingPayload.logistics}` : undefined,
    loadingPayload.vibe ? `Vibe: ${loadingPayload.vibe}` : undefined,
  ].filter(Boolean) as string[];
  const buildSteps = [
    "Reading trip basics",
    "Checking live event inventory",
    "Scoring restaurants and free stops",
    "Balancing timing, buffers, and walking",
    "Running itinerary sanity check",
    "Saving your game plan",
  ];

  useEffect(() => {
    if (!tripSelectionsHydrated || dateDraftEditedRef.current) return;

    setArrivalDate(savedTripDates.arrivalDate);
    setDepartureDate(savedTripDates.departureDate);
  }, [savedTripDates.arrivalDate, savedTripDates.departureDate, tripSelectionsHydrated]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const token = window.localStorage.getItem("experiencevegas:lastPlanToken");

      if (token) {
        setSavedPlanToken(token);
        setSavedPlanFound(true);
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const progressTimer = window.setInterval(() => {
      setBuildProgress((current) => Math.min(current + 9, 94));
      setBuildStepIndex((current) => Math.min(current + 1, buildSteps.length - 1));
    }, 700);

    return () => window.clearInterval(progressTimer);
  }, [buildSteps.length, loading]);

  useEffect(() => {
    if (!loading) return;

    const scrollTimer = window.setTimeout(() => {
      buildPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    return () => window.clearTimeout(scrollTimer);
  }, [loading]);

  function setRefinement(key: string, value: string) {
    setRefinements((current) => ({ ...current, [key]: value }));
  }

  function toggleMultiRefinement(key: string, value: string) {
    setMultiRefinements((current) => {
      const values = current[key] || [];
      let nextValues: string[];

      if (key === "gamblingPreference") {
        const exclusiveOptions = ["No gambling", "Casino atmosphere only"];
        if (exclusiveOptions.includes(value)) {
          nextValues = values.includes(value) ? [] : [value];
        } else {
          const compatibleValues = values.filter((item) => !exclusiveOptions.includes(item));
          nextValues = compatibleValues.includes(value)
            ? compatibleValues.filter((item) => item !== value)
            : [...compatibleValues, value];
        }
      } else {
        nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      }

      return { ...current, [key]: nextValues };
    });
  }

  function buildPlannerPayload(overrides: Partial<Record<string, string>> = {}): PlannerInput {
    const travelDates =
      arrivalDate && departureDate ? `${arrivalDate} to ${departureDate}` : arrivalDate || departureDate;

    const selectedPlaces = tripPicks.length
      ? `Requested trip picks: ${tripPicks.map((item) => `${item.name} (${item.category}, ${item.area}, status: ${item.status || "considering"}${item.locked ? ", locked" : ""})`).join("; ")}. Locked and booked picks must remain fixed. Must-do picks take priority. Backup picks should only fill open time. Explain any choice that cannot fit.`
      : "";
    const tripBudget = tripSettings.budgetCap > 0 ? `Target whole-trip activity budget: $${tripSettings.budgetCap} for ${tripSettings.partySize} travelers.` : `Party size: ${tripSettings.partySize} travelers.`;

    return {
      prompt,
      travelDates,
      budget: overrides.budget || mixedSelectionText("ticket", selectedValues("Ticket budget")),
      groupType: overrides.groupType || selectedValue("Group"),
      stayingNear: overrides.stayingNear || selectedValue("Lodging"),
      vibe: overrides.vibe || selectedValue("Vibe") || prompt,
      foodPreference: overrides.foodPreference || multiRefinements.foodPreference?.join(", ") || refinements.foodPreference,
      mealBudget:
        overrides.mealBudget ||
        mixedSelectionText("meal", multiRefinements.mealBudget || []) ||
        refinements.mealBudget,
      gamblingPreference:
        overrides.gamblingPreference ||
        mixedSelectionText("gambling", multiRefinements.gamblingPreference || []) ||
        refinements.gamblingPreference,
      pace: overrides.pace || refinements.pace,
      logistics: overrides.logistics || refinements.logistics,
      additionalDetails: [additionalDetails, selectedPlaces, tripBudget].filter(Boolean).join(" ").slice(0, 1_500),
    };
  }

  async function savePlan(input: PlannerInput, nextResult: PlannerResponse) {
    setSavingPlan(true);
    setSaveStatus("Saving this game plan...");

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, result: nextResult }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;
        const invalidKey = data?.error?.toLowerCase().includes("invalid api key");
        const errorText = invalidKey
          ? "Supabase rejected the API key. Verify that NEXT_PUBLIC_SUPABASE_URL and the full SUPABASE_SECRET_KEY belong to the same Supabase project, then redeploy."
          : data?.error
            ? `${data.error}${data.code ? ` (${data.code})` : ""}`
            : "Could not save this plan yet.";
        setSaveStatus(`Could not save plan: ${errorText}`);
        setSavingPlan(false);
        return "";
      }

      const data = (await response.json()) as { shareToken?: string; expiresAt?: string };

      if (data.shareToken) {
        setSavedPlanToken(data.shareToken);
        setSavedPlanExpiresAt(data.expiresAt || "");
        setSavedPlanFound(false);
        setSaveStatus("");
        window.localStorage.setItem("experiencevegas:lastPlanToken", data.shareToken);
        setSavingPlan(false);
        return data.shareToken;
      }

      setSaveStatus("Plan built, but no saved link was returned.");
      setSavingPlan(false);
      return "";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown save error.";
      setSaveStatus(`Could not save plan: ${message}`);
      setSavingPlan(false);
      return "";
    }
  }

  async function retrySavePlan() {
    if (!planInput || !result) {
      setSaveStatus("Build a plan first, then save it.");
      return;
    }

    await savePlan(planInput, result);
  }

  async function loadSavedPlan() {
    if (!savedPlanToken) return;

    setLoading(true);
    const response = await fetch(`/api/plans/${savedPlanToken}`);

    if (response.ok) {
      const data = (await response.json()) as { input: PlannerInput; result: PlannerResponse; expiresAt?: string };
      setPlanInput(data.input);
      setResult(data.result);
      setSavedPlanExpiresAt(data.expiresAt || "");
      setSavedPlanFound(false);
      setShowRefinements(true);
    }

    setLoading(false);
  }

  async function buildPlan(overrides: Partial<Record<string, string>> = {}) {
    if (!datesAreSet) {
      setDateError("Choose arrival and departure dates first so we can use real Vegas schedules.");
      return;
    }

    if (arrivalDate < today) {
      setDateError("Choose an arrival date from today forward so we can use current schedules.");
      return;
    }

    if (departureDate < arrivalDate) {
      setDateError("Your departure date must be on or after your arrival date.");
      return;
    }

    if (tripLengthInDays(arrivalDate, departureDate) > 7) {
      setDateError("Choose a trip of 7 planning days or fewer.");
      return;
    }

    setBuildProgress(8);
    setBuildStepIndex(0);
    setLoading(true);
    setResult(null);
    setEmailMessage("");
    setSaveStatus("");

    const payload = buildPlannerPayload(overrides);
    setPlanInput(payload);
    const minimumBuildTime = new Promise((resolve) => window.setTimeout(resolve, 6000));

    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "The planner could not build this trip yet.");
      }

      const nextResult = (await response.json()) as PlannerResponse;
      const nextToken = await savePlan(payload, nextResult);
      await minimumBuildTime;
      setBuildStepIndex(buildSteps.length - 1);
      setBuildProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 650));

      if (nextToken) {
        router.replace(`/plan/${nextToken}`);
        return;
      }

      setResult(nextResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The planner could not build this trip yet.";
      setSaveStatus(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email) {
      setEmailMessage("Add an email address first.");
      return;
    }

    setSavingEmail(true);
    setEmailMessage("");

    if (!savedPlanToken && planInput && result) {
      const nextToken = await savePlan(planInput, result);
      if (nextToken) {
        setSavedPlanToken(nextToken);
      }
    }

    const token = savedPlanToken || window.localStorage.getItem("experiencevegas:lastPlanToken");

    if (!token) {
      setSavingEmail(false);
      setEmailMessage("Build a plan first, then save it.");
      return;
    }

    const response = await fetch(`/api/plans/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setSavingEmail(false);
    setEmailMessage(response.ok ? "Saved. You can come back to this game plan anytime from this browser." : "Plan saved locally, but email could not be attached yet.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!datesAreSet) {
      setDateFieldsTouched({ arrival: true, departure: true });
      setDateError(arrivalError || departureError || "Check your trip dates before continuing.");
      return;
    }

    if (!showRefinements) {
      setShowRefinements(true);
      setResult(null);
      return;
    }

    await buildPlan();
  }

  return (
    <section id="trip-builder" className={`relative overflow-hidden px-4 pb-10 sm:px-5 md:pb-16 ${compact ? "pt-7 sm:pt-9" : "pt-8 sm:pt-12 lg:pt-16"}`}>
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(217,70,239,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_72%)]" />
      <div className="mx-auto max-w-5xl">
        <div className={`mx-auto max-w-3xl text-center ${result ? "hidden md:block" : ""}`}>
          {!compact ? <p className="mx-auto mb-5 inline-flex max-w-full rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-xs font-black uppercase leading-5 tracking-[0.18em] text-amber-100 sm:text-sm">Vegas planning that starts with what you actually want</p> : null}
          <h1 className={`font-black leading-[1.01] text-white ${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"}`}>
            {compact ? "Build your itinerary" : "Build your Vegas game plan."}
          </h1>
          <p className={`mx-auto max-w-2xl leading-8 text-white/75 ${compact ? "mt-3 text-base" : "mt-5 text-lg sm:text-xl sm:leading-9"}`}>
            {compact ? "Start with dates, then add the details that matter. We will turn them into a timed Vegas plan." : "Tell ExperienceVegas the dates, ticket budget, food spend, group, lodging, and vibe. We will turn the messy ticket search into a timed plan for events, food, casino time, and places worth seeing."}
          </p>
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-4 gap-1.5 text-left sm:gap-2">
            {["Pick dates", "Tell us the trip", "Tune the plan", "Get the game plan"].map((step, index) => {
              const currentStep = result ? 3 : showRefinements ? 2 : datesAreSet ? 1 : 0;
              const isCurrent = index === currentStep;
              const isComplete = index < currentStep;

              return (
                <div key={step} aria-current={isCurrent ? "step" : undefined} className={`min-w-0 rounded-lg border px-2 py-2 sm:px-3 sm:py-3 ${isCurrent ? "border-amber-200 bg-amber-100/15" : isComplete ? "border-emerald-300/30 bg-emerald-300/10" : "border-white/10 bg-white/[0.04]"}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.1em] sm:text-xs sm:tracking-[0.16em] ${isCurrent ? "text-amber-100" : "text-white/55"}`}>Step {index + 1}</p>
                  <p className="mt-1 hidden text-sm font-black text-white sm:block">{step}</p>
                </div>
              );
            })}
          </div>
        </div>

        {savedPlanFound ? (
          <div className="mx-auto mt-6 flex flex-col gap-3 rounded-lg border border-amber-100/20 bg-amber-100/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-white">Continue your last Vegas game plan?</p>
              <p className="mt-1 text-sm text-white/55">We saved it privately on this browser.</p>
            </div>
                   <button
              type="button"
              onClick={loadSavedPlan}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-200 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? "Loading..." : "Open Last Plan"}
            </button>
          </div>
        ) : null}

        {tripPicks.length && !loading && !result ? (
          <div className="mx-auto mt-6 rounded-lg border border-fuchsia-200/20 bg-fuchsia-200/[0.07] px-4 py-3 text-sm leading-6 text-white/70">
            <span className="font-black text-white">{tripPicks.length} saved trip pick{tripPicks.length === 1 ? "" : "s"} will be considered:</span>{" "}
            {tripPicks.slice(0, 4).map((item) => item.name).join(", ")}{tripPicks.length > 4 ? `, and ${tripPicks.length - 4} more` : ""}.
          </div>
        ) : null}

        {!loading && !result ? (
          <form onSubmit={handleSubmit} className="mx-auto mt-8 rounded-lg border border-white/10 bg-white/[0.08] p-3 shadow-2xl shadow-black/30 backdrop-blur sm:p-4">
            <div className="rounded-lg border border-white/10 bg-black/35 p-3 sm:p-4">
            <div className="rounded-lg border border-amber-100/20 bg-amber-100/[0.07] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                  <CalendarDays className="h-4 w-4" /> Step 1: Pick your Vegas dates
                </p>
                <button type="button" onClick={loadSampleTrip} className="inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition hover:bg-white/10">
                  Try sample: weekend for 4
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
                <DateRangeFields arrivalDate={arrivalDate} departureDate={departureDate} minArrival={today} maxDeparture={maxDepartureDate} onArrivalChange={(value) => updateTravelDates(value, departureDate)} onDepartureChange={(value) => updateTravelDates(arrivalDate, value)} onArrivalBlur={() => setDateFieldsTouched((current) => ({ ...current, arrival: true }))} onDepartureBlur={() => setDateFieldsTouched((current) => ({ ...current, departure: true }))} arrivalError={dateFieldsTouched.arrival ? arrivalError : ""} departureError={dateFieldsTouched.departure ? departureError : ""} theme="dark" />
              </div>
              <p data-testid="date-status" aria-live="polite" className={`mt-3 text-sm font-bold ${datesAreSet ? "text-emerald-200" : "text-white/65"}`}>
                {datesAreSet ? `Dates set: ${formatTravelDate(arrivalDate)} to ${formatTravelDate(departureDate)}` : "Add your arrival and departure dates to continue."}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/55">Plans cover arrival through the day before departure, up to 7 days. Same-day trips receive a one-day plan.</p>
              {dateError ? <p className="mt-3 text-sm font-bold text-amber-100">{dateError}</p> : null}
            </div>

            {datesAreSet ? (
            <div className="mt-4">
              <label className="sr-only" htmlFor="experience-prompt">
                Describe your perfect Vegas experience
              </label>
              <textarea
                id="experience-prompt"
                value={prompt}
                disabled={!datesAreSet}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-36 w-full resize-none bg-transparent px-1 py-1 text-base leading-7 text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed sm:min-h-40 sm:text-lg"
                placeholder={datesAreSet ? starterPrompt : "Pick your dates first, then describe the trip you want."}
              />

              <div className="mt-3 border-t border-white/10 pt-4">
                <div className="grid gap-3 md:grid-cols-4">
                {helperGroups.map((group) => {
                  const Icon = group.icon;

                  return (
                    <div key={group.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                        <Icon className="h-4 w-4 text-amber-100" /> {group.label}
                      </p>
                      {group.multi ? <p className="mb-2 text-[11px] font-semibold text-white/45">Choose all that fit.</p> : null}
                      <div className="flex flex-wrap gap-2 md:block md:space-y-2">
                        {group.options.map((option) => {
                          const key = `${group.label}:${option}`;
                          const isSelected = selectedHelpers.includes(key);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => addHelper(group.label, option)}
                              aria-pressed={isSelected}
                              className={`rounded-full px-3 py-2 text-left text-xs font-bold leading-5 transition md:w-full ${
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
                })}
                </div>
              </div>
            </div>
            ) : null}

            {showRefinements ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">Tune your itinerary</p>
                    <h2 className="mt-2 text-2xl font-black text-white">A few quick choices make the game plan much better.</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => buildPlan()}
                    disabled={loading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-200 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-70"
                  >
                     {loading ? "Building..." : "Build My Game Plan"} {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                   </button>
                   <button
                     type="button"
                     onClick={() => buildPlan()}
                     disabled={loading}
                     className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                   >
                     Skip tuning
                   </button>
                 </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-5">
                  {refinementGroups.map((group) => (
                    <div key={group.key} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/50">{group.label}</p>
                      {group.multi ? <p className="mb-2 text-[11px] font-semibold text-white/45">Choose all that fit.</p> : null}
                      <div className="flex flex-wrap gap-2 lg:block lg:space-y-2">
                        {group.options.map((option) => {
                          const isSelected = group.multi
                            ? multiRefinements[group.key]?.includes(option)
                            : refinements[group.key] === option;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => (group.multi ? toggleMultiRefinement(group.key, option) : setRefinement(group.key, option))}
                              aria-pressed={isSelected}
                              className={`rounded-full px-3 py-2 text-left text-xs font-bold leading-5 transition lg:w-full ${
                                isSelected ? "bg-amber-200 text-black" : "bg-white/10 text-white/72 hover:bg-white/15"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <label className="mt-4 grid gap-2 text-sm font-bold text-white/70">
                  Anything else we should know?
                  <textarea
                    value={additionalDetails}
                    onChange={(event) => setAdditionalDetails(event.target.value)}
                    className="min-h-20 resize-none rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-amber-100/70"
                    placeholder="Dietary restrictions, must-see restaurants, no late nights, celebrating a birthday..."
                  />
                </label>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-white/45">{helperSummary}</p>
              <button
                data-testid="planner-primary-cta"
                data-state={plannerCtaState}
                disabled={loading || !datesAreSet}
                aria-disabled={loading || !datesAreSet}
                aria-describedby={saveStatus ? "planner-build-error" : undefined}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 font-black transition sm:min-w-56 ${plannerCtaState === "loading" ? "cursor-wait bg-amber-100/70 text-black" : plannerCtaState === "error" ? "bg-rose-200 text-rose-950 hover:bg-rose-100" : plannerCtaState === "ready" ? "bg-gradient-to-r from-amber-300 to-fuchsia-300 text-zinc-950 shadow-lg shadow-fuchsia-950/20 hover:brightness-110" : "cursor-not-allowed border border-white/20 bg-white/15 text-white/65"}`}
              >
                {loading ? "Building..." : !datesAreSet ? "Choose Dates First" : saveStatus ? "Try Building Again" : showRefinements ? "Build My Game Plan" : "Continue to Trip Details"} {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
            {saveStatus ? <p id="planner-build-error" role="alert" className="mt-3 text-sm font-bold text-amber-100">{saveStatus}</p> : null}
          </div>
          </form>
        ) : null}

        {loading ? (
          <div
            ref={buildPanelRef}
            className="mx-auto mt-8 min-h-[32rem] scroll-mt-24 overflow-hidden rounded-lg border border-amber-100/20 bg-amber-100/[0.08] p-5 shadow-2xl shadow-black/30 sm:p-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-black text-amber-100">
                  <Loader2 className="h-4 w-4 animate-spin" /> Building your Vegas game plan
                </p>
                <h3 className="mt-3 text-2xl font-black text-white">Trip dates locked: {loadingDates}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                  We are turning your trip inputs into a timed plan with live events, food, free stops, timing buffers, and booking priorities.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-right">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Progress</p>
                <p className="mt-1 text-2xl font-black text-white">{buildProgress}%</p>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-amber-200 transition-all duration-500"
                style={{ width: `${buildProgress}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg bg-black/25 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">Analyzing selections</p>
                <div className="mt-3 flex max-h-36 flex-wrap gap-2 overflow-hidden">
                  {(loadingSelections.length > 0 ? loadingSelections : ["Flexible trip details", "Balanced Vegas pace", "Worth-booking anchor"]).map((selection, index) => (
                    <span
                      key={selection}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                        index === buildStepIndex % Math.max(loadingSelections.length, 1)
                          ? "bg-amber-200 text-black"
                          : "bg-white/10 text-white/62"
                      }`}
                    >
                      {selection}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-black/25 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">Planner actions</p>
                <div className="mt-3 grid gap-2">
                  {buildSteps.map((step, index) => (
                    <div
                      key={step}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                        index <= buildStepIndex
                          ? "border-amber-100/25 bg-amber-100/[0.08] text-white"
                          : "border-white/10 bg-white/[0.03] text-white/40"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${index <= buildStepIndex ? "bg-amber-200" : "bg-white/20"}`} />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {result ? (
          <PlanResult
            result={result}
            shareUrl={shareUrl}
            expiresAt={savedPlanExpiresAt}
            email={email}
            savingEmail={savingEmail}
            emailMessage={emailMessage}
            onEmailChange={setEmail}
            onEmailSubmit={handleEmailSubmit}
            tuneOptions={tuneOptions}
            onTune={(updates) => buildPlan(updates)}
            loading={loading}
            saveStatus={saveStatus}
            savingPlan={savingPlan}
            onSaveRetry={retrySavePlan}
          />
        ) : null}
      </div>
    </section>
  );
}
