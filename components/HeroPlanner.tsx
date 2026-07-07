"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Loader2, MapPin, Sparkles, Users, WalletCards } from "lucide-react";

const helperGroups = [
  {
    label: "Dates",
    icon: CalendarDays,
    options: ["tonight", "this weekend", "Friday to Sunday", "next month"],
  },
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
    label: "Area",
    icon: MapPin,
    options: ["near Sphere", "near Bellagio", "near Caesars", "near T-Mobile Arena"],
  },
  {
    label: "Vibe",
    icon: Sparkles,
    options: ["big Vegas spectacle", "easy laughs", "sports energy", "not too touristy"],
  },
];

const starterPrompt =
  "We want a memorable Vegas night with one strong anchor, easy logistics, and something that feels worth booking.";

function sentenceFor(group: string, option: string) {
  if (group === "Dates") return `Dates: ${option}.`;
  if (group === "Budget") return `Budget: ${option}.`;
  if (group === "Group") return `Group: ${option}.`;
  if (group === "Area") return `Staying ${option}.`;
  return `Vibe: ${option}.`;
}

export function HeroPlanner() {
  const [prompt, setPrompt] = useState("");
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasGenerated(true);
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
            Describe your perfect Vegas experience.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl sm:leading-9">
            Tell ExperienceVegas the dates, budget, group, location, and vibe. We will turn the messy ticket search into a focused plan worth booking.
          </p>
        </div>

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

            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-white/45">{helperSummary}</p>
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-black text-black transition hover:bg-amber-100 sm:min-w-56">
                Build My Experience <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {hasGenerated ? (
          <div className="mx-auto mt-5 rounded-lg border border-amber-100/20 bg-amber-100/[0.08] p-5">
            <p className="inline-flex items-center gap-2 text-sm font-black text-amber-100">
              <Loader2 className="h-4 w-4 animate-spin" /> Planning your experience
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-white/68 sm:grid-cols-3">
              <p className="rounded-lg bg-black/25 p-4">Reading your dates, budget, group, area, and vibe.</p>
              <p className="rounded-lg bg-black/25 p-4">Scoring shows, comedy, sports, concerts, and attractions for fit.</p>
              <p className="rounded-lg bg-black/25 p-4">Building a short, bookable plan with strong nearby options.</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
