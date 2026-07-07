"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Loader2, MapPin, Sparkles, Users, WalletCards } from "lucide-react";
import { PlanResult } from "@/components/PlanResult";
import { PlannerInput, PlannerResponse } from "@/types/planner";

const tuneOptions = [
  { label: "Make cheaper", updates: { mealBudget: "Save money for events", budget: "under $100 per person" } },
  { label: "More premium", updates: { mealBudget: "One premium dinner", budget: "premium but worth it" } },
  { label: "Less walking", updates: { logistics: "Keep it walkable" } },
  { label: "More food-focused", updates: { mealBudget: "Food is a big part" } },
  { label: "More gambling", updates: { gamblingPreference: "Table games" } },
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
    label: "Meal budget",
    key: "mealBudget",
    multi: false,
    options: ["Save money for events", "Balanced meals and tickets", "Food is a big part", "One premium dinner"],
  },
  {
    label: "Gambling",
    key: "gamblingPreference",
    multi: false,
    options: ["No gambling", "Light casino time", "Slots", "Table games", "Poker", "Sportsbook", "Casino atmosphere"],
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
    label: "Budget",
    icon: WalletCards,
    options: ["under $100 per person", "$100-$200 per person", "premium but worth it"],
  },
  {
    label: "Group",
    icon: Users,
    options: ["couple", "friends trip", "family with teens", "bachelor party"],
  },
  {
    label: "Lodging",
    icon: MapPin,
    options: ["haven't booked lodging yet", "center Strip", "near Bellagio", "near Caesars", "near Sphere", "near T-Mobile Arena", "Downtown"],
  },
  {
    label: "Vibe",
    icon: Sparkles,
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

function sentenceFor(group: string, option: string) {
  if (group === "Budget") return `Budget: ${option}.`;
  if (group === "Group") return `Group: ${option}.`;
  if (group === "Lodging") {
    return option.includes("haven't booked") ? "Lodging: not booked yet." : `Staying near ${option}.`;
  }
  return `Vibe: ${option}.`;
}

function upsertPromptSentence(current: string, label: string, sentence: string) {
  const trimmed = current.trim();
  const pattern = new RegExp(`${label}: [^.]*\\.`);

  if (pattern.test(trimmed)) {
    return trimmed.replace(pattern, sentence);
  }

  return trimmed.length > 0 ? `${trimmed} ${sentence}` : sentence;
}

export function HeroPlanner() {
  const [prompt, setPrompt] = useState("");
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [result, setResult] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRefinements, setShowRefinements] = useState(false);
  const [refinements, setRefinements] = useState<Record<string, string>>({});
  const [multiRefinements, setMultiRefinements] = useState<Record<string, string[]>>({});
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [savedPlanToken, setSavedPlanToken] = useState("");
  const [savedPlanFound, setSavedPlanFound] = useState(false);
  const [planInput, setPlanInput] = useState<PlannerInput | null>(null);
  const [email, setEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const helperSummary = useMemo(() => {
    if (selectedHelpers.length === 0) return "Add dates, budget, group, area, and vibe when you know them.";
    return `${selectedHelpers.length} detail${selectedHelpers.length === 1 ? "" : "s"} added to your request.`;
  }, [selectedHelpers.length]);

  function addHelper(group: string, option: string) {
    const key = `${group}:${option}`;
    if (selectedHelpers.includes(key)) return;

    setSelectedHelpers((current) => [...current, key]);
    setPrompt((current) => {
      const nextSentence = sentenceFor(group, option);
      return current.trim().length > 0 ? `${current.trim()} ${nextSentence}` : nextSentence;
    });
  }

  function updateTravelDates(nextArrivalDate: string, nextDepartureDate: string) {
    setArrivalDate(nextArrivalDate);
    setDepartureDate(nextDepartureDate);

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

  function selectedValue(label: string) {
    return selectedHelpers.find((helper) => helper.startsWith(`${label}:`))?.split(":").slice(1).join(":");
  }

  const shareUrl =
    savedPlanToken && typeof window !== "undefined" ? `${window.location.origin}/plan/${savedPlanToken}` : undefined;

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

  function setRefinement(key: string, value: string) {
    setRefinements((current) => ({ ...current, [key]: value }));
  }

  function toggleMultiRefinement(key: string, value: string) {
    setMultiRefinements((current) => {
      const values = current[key] || [];
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

      return { ...current, [key]: nextValues };
    });
  }

  function buildPlannerPayload(overrides: Partial<Record<string, string>> = {}): PlannerInput {
    const travelDates =
      arrivalDate && departureDate ? `${arrivalDate} to ${departureDate}` : arrivalDate || departureDate;

    return {
      prompt,
      travelDates,
      budget: overrides.budget || selectedValue("Budget"),
      groupType: overrides.groupType || selectedValue("Group"),
      stayingNear: overrides.stayingNear || selectedValue("Lodging"),
      vibe: overrides.vibe || selectedValue("Vibe") || prompt,
      foodPreference: overrides.foodPreference || multiRefinements.foodPreference?.join(", ") || refinements.foodPreference,
      mealBudget: overrides.mealBudget || refinements.mealBudget,
      gamblingPreference: overrides.gamblingPreference || refinements.gamblingPreference,
      pace: overrides.pace || refinements.pace,
      logistics: overrides.logistics || refinements.logistics,
      additionalDetails,
    };
  }

  async function savePlan(input: PlannerInput, nextResult: PlannerResponse) {
    setSaveStatus("Saving this game plan...");

    const response = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, result: nextResult }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setSaveStatus(data?.error ? `Could not save plan: ${data.error}` : "Could not save this plan yet.");
      return "";
    }

    const data = (await response.json()) as { shareToken?: string };

    if (data.shareToken) {
      setSavedPlanToken(data.shareToken);
      setSavedPlanFound(false);
      setSaveStatus("");
      window.localStorage.setItem("experiencevegas:lastPlanToken", data.shareToken);
      return data.shareToken;
    }

    setSaveStatus("Plan built, but no saved link was returned.");
    return "";
  }

  async function loadSavedPlan() {
    if (!savedPlanToken) return;

    setLoading(true);
    const response = await fetch(`/api/plans/${savedPlanToken}`);

    if (response.ok) {
      const data = (await response.json()) as { input: PlannerInput; result: PlannerResponse; email?: string };
      setPlanInput(data.input);
      setResult(data.result);
      setEmail(data.email || "");
      setSavedPlanFound(false);
      setShowRefinements(true);
    }

    setLoading(false);
  }

  async function buildPlan(overrides: Partial<Record<string, string>> = {}) {
    setLoading(true);
    setResult(null);
    setEmailMessage("");
    setSaveStatus("");

    const payload = buildPlannerPayload(overrides);

    const response = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const nextResult = (await response.json()) as PlannerResponse;
    setPlanInput(payload);
    setResult(nextResult);
    setLoading(false);
    await savePlan(payload, nextResult);
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

    if (!showRefinements) {
      setShowRefinements(true);
      setResult(null);
      return;
    }

    await buildPlan();
  }

  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-8 sm:px-5 sm:pt-12 md:pb-16 lg:pt-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(217,70,239,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_72%)]" />
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mx-auto mb-5 inline-flex max-w-full rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-xs font-black uppercase leading-5 tracking-[0.18em] text-amber-100 sm:text-sm">
            Vegas planning that starts with what you actually want
          </p>
          <h1 className="text-4xl font-black leading-[1.01] text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Build your Vegas game plan.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl sm:leading-9">
            Tell ExperienceVegas the dates, budget, group, location, and vibe. We will turn the messy ticket search into a timed plan for events, food, casino time, and places worth seeing.
          </p>
          <div className="mx-auto mt-6 grid max-w-2xl gap-2 text-left sm:grid-cols-3">
            {["Tell us the trip", "Tune the plan", "Get the game plan"].map((step, index) => {
              const isActive = index === 0 || (index === 1 && showRefinements) || (index === 2 && result);

              return (
                <div key={step} className={`rounded-lg border px-3 py-3 ${isActive ? "border-amber-100/40 bg-amber-100/10" : "border-white/10 bg-white/[0.04]"}`}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Step {index + 1}</p>
                  <p className="mt-1 text-sm font-black text-white">{step}</p>
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

        <form onSubmit={handleSubmit} className="mx-auto mt-8 rounded-lg border border-white/10 bg-white/[0.08] p-3 shadow-2xl shadow-black/30 backdrop-blur sm:p-4">
          <div className="rounded-lg border border-white/10 bg-black/35 p-3 sm:p-4">
            <label className="sr-only" htmlFor="experience-prompt">
              Describe your perfect Vegas experience
            </label>
            <textarea
              id="experience-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-36 w-full resize-none bg-transparent px-1 py-1 text-base leading-7 text-white outline-none placeholder:text-white/35 sm:min-h-40 sm:text-lg"
              placeholder={starterPrompt}
            />

            <div className="mt-3 border-t border-white/10 pt-4">
              <div className="grid gap-3 md:grid-cols-5">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                    <CalendarDays className="h-4 w-4 text-amber-100" /> Dates
                  </p>
                  <div className="grid gap-2">
                    <label className="grid gap-1 text-xs font-bold text-white/55">
                      Arrive
                      <input
                        type="date"
                        value={arrivalDate}
                        onChange={(event) => updateTravelDates(event.target.value, departureDate)}
                        className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-white [color-scheme:dark] outline-none transition focus:border-amber-100/70"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-white/55">
                      Leave
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(event) => updateTravelDates(arrivalDate, event.target.value)}
                        className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-white [color-scheme:dark] outline-none transition focus:border-amber-100/70"
                      />
                    </label>
                  </div>
                </div>
                {helperGroups.map((group) => {
                  const Icon = group.icon;

                  return (
                    <div key={group.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                        <Icon className="h-4 w-4 text-amber-100" /> {group.label}
                      </p>
                      <div className="flex flex-wrap gap-2 md:block md:space-y-2">
                        {group.options.map((option) => {
                          const key = `${group.label}:${option}`;
                          const isSelected = selectedHelpers.includes(key);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => addHelper(group.label, option)}
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
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-5">
                  {refinementGroups.map((group) => (
                    <div key={group.key} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/50">{group.label}</p>
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
              <button disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-black text-black transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-70 sm:min-w-56">
                {loading ? "Building..." : showRefinements ? "Build My Game Plan" : "Build My Experience"} {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="mx-auto mt-5 rounded-lg border border-amber-100/20 bg-amber-100/[0.08] p-5">
            <p className="inline-flex items-center gap-2 text-sm font-black text-amber-100">
              <Loader2 className="h-4 w-4 animate-spin" /> Planning your experience
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-white/68 sm:grid-cols-3">
              <p className="rounded-lg bg-black/25 p-4">Reading your dates, budget, group, area, and vibe.</p>
              <p className="rounded-lg bg-black/25 p-4">Scoring shows, comedy, sports, concerts, and attractions for fit.</p>
              <p className="rounded-lg bg-black/25 p-4">Building your Vegas game plan with strong nearby options.</p>
            </div>
          </div>
        ) : null}

        {result ? (
          <PlanResult
            result={result}
            shareUrl={shareUrl}
            email={email}
            savingEmail={savingEmail}
            emailMessage={emailMessage}
            onEmailChange={setEmail}
            onEmailSubmit={handleEmailSubmit}
            tuneOptions={tuneOptions}
            onTune={(updates) => buildPlan(updates)}
            loading={loading}
            saveStatus={saveStatus}
          />
        ) : null}
      </div>
    </section>
  );
}
