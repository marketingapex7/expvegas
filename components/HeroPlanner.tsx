"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles, Users } from "lucide-react";

const vibeOptions = ["Big spectacle", "Comedy", "Date night", "Family-friendly", "Sports", "Under $100", "Near Sphere", "No gambling"];
const itineraries = [
  {
    label: "Signature night",
    title: "One unforgettable anchor, no overplanning spiral",
    plan: ["Dinner near Bellagio or Caesars", "Premium show, Sphere, or headline venue", "After-show drinks within walking distance"],
    fit: "For visitors who want the trip to feel unmistakably Vegas, fast.",
    budget: "$125-$220 per person",
    cta: "/shows",
  },
  {
    label: "Smart value",
    title: "Real night out, lighter ticket spend",
    plan: ["Casual dinner in the right part of town", "Strong comedy room or flexible attraction", "Easy late-night add-on nearby"],
    fit: "For groups that care about the memory more than the receipt.",
    budget: "$45-$110 per person",
    cta: "/cheap-things-to-do",
  },
  {
    label: "High-energy plan",
    title: "Bigger crowd, louder room, better momentum",
    plan: ["Pick the arena, game, concert, or spectacle first", "Book around venue location", "Keep the next stop close and simple"],
    fit: "For sports weekends, friend groups, bachelor trips, and concert nights.",
    budget: "$100-$250 per person",
    cta: "/attractions",
  },
];

export function HeroPlanner() {
  const [selectedVibes, setSelectedVibes] = useState<string[]>(["Big spectacle", "Date night"]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const summary = useMemo(() => {
    if (selectedVibes.length === 0) {
      return "Tell us the vibe and we will shape the plan around it.";
    }

    return `Tuned for ${selectedVibes.slice(0, 3).join(", ").toLowerCase()}${selectedVibes.length > 3 ? ", and more" : ""}.`;
  }, [selectedVibes]);

  function toggleVibe(vibe: string) {
    setSelectedVibes((current) =>
      current.includes(vibe) ? current.filter((item) => item !== vibe) : [...current, vibe],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasGenerated(true);
  }

  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-8 sm:px-5 sm:pt-12 md:pb-16 lg:pt-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.2),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(217,70,239,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_72%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start">
          <div className="max-w-3xl pt-2 lg:sticky lg:top-28">
            <p className="mb-5 inline-flex max-w-full rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-xs font-black uppercase leading-5 tracking-[0.18em] text-amber-100 sm:text-sm">
              Curated Vegas decisions, not a ticket catalog
            </p>
            <h1 className="text-4xl font-black leading-[1.01] text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Find the Vegas plan worth booking tonight.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl sm:leading-9">
              Tell us your dates, group, budget, location, and vibe. ExperienceVegas narrows shows, comedy, sports, concerts, and attractions into a short list that actually fits the trip.
            </p>
            <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-2xl font-black text-white">60 sec</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/45">Shortlist</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-2xl font-black text-white">5 lanes</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/45">Shows to sports</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-2xl font-black text-white">No fluff</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/45">Worth booking</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.08] shadow-2xl shadow-black/30 backdrop-blur">
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-100">Trip Finder</p>
                  <h2 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">Build the shortlist before you buy.</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/58">
                    Answer like you would text a local friend. We will weigh fit, price, area, and energy.
                  </p>
                </div>
                <div className="rounded-lg bg-white px-4 py-3 text-center text-black sm:min-w-24">
                  <p className="text-2xl font-black leading-none">1</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em]">minute</p>
                </div>
              </div>

              <label className="mt-5 grid gap-2 text-sm font-bold text-white/75">
                What would make the night a win?
                <textarea
                  className="min-h-28 resize-none rounded-lg border border-white/10 bg-black/35 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-amber-100/70"
                  placeholder="Example: Staying near Caesars this weekend, two couples, around $150 each, want something impressive but not too touristy."
                />
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 text-sm font-bold text-white/75">
                  <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-amber-100" /> Trip dates</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                      Arrive
                      <input type="date" className="min-h-12 rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-white [color-scheme:dark] outline-none transition focus:border-amber-100/70" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                      Leave
                      <input type="date" className="min-h-12 rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-white [color-scheme:dark] outline-none transition focus:border-amber-100/70" />
                    </label>
                  </div>
                </div>
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-100" /> Staying near</span>
                  <input className="min-h-12 rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-amber-100/70" placeholder="Sphere, Bellagio, MGM..." />
                </label>
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-amber-100" /> Group</span>
                  <select className="min-h-12 rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-amber-100/70">
                    <option>Couple</option><option>Friends trip</option><option>Family</option><option>Bachelor party</option><option>Bachelorette party</option><option>Solo</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  Budget per person for the night
                  <select className="min-h-12 rounded-lg border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-amber-100/70">
                    <option>$75-$150 per person</option><option>Under $75 per person</option><option>$150-$250 per person</option><option>Premium / flexible</option>
                  </select>
                  <span className="text-xs font-semibold leading-5 text-white/45">Used for tickets and night-out plans, not hotel or flight budget.</span>
                </label>
              </div>

              <div className="mt-5">
                <p className="inline-flex items-center gap-2 text-sm font-bold text-white/75"><Sparkles className="h-4 w-4 text-amber-100" /> Vibe filters</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vibeOptions.map((vibe) => {
                    const isSelected = selectedVibes.includes(vibe);

                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => toggleVibe(vibe)}
                        className={`rounded-full px-3 py-2 text-sm font-bold transition ${
                          isSelected ? "bg-amber-200 text-black" : "bg-white/10 text-white/72 hover:bg-white/15"
                        }`}
                      >
                        {vibe}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-4 font-black text-black transition hover:bg-amber-100">
                Build My Shortlist <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-xs font-bold text-white/45">{summary}</p>
            </form>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {itineraries.map((itinerary) => (
            <article key={itinerary.label} className="rounded-lg border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:border-amber-100/30 hover:bg-white/[0.09]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">{itinerary.label}</p>
              <h3 className="mt-3 text-xl font-black leading-tight text-white sm:text-2xl">{itinerary.title}</h3>
              <div className="mt-5 space-y-3">
                {itinerary.plan.map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white">{index + 1}</span>
                    <p className="text-sm leading-6 text-white/70">{step}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-white/62">{itinerary.fit}</p>
              <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
                <p className="text-sm font-black text-white">{itinerary.budget}</p>
                <Link href={itinerary.cta} className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-center text-sm font-black text-black transition hover:bg-amber-100">
                  {hasGenerated ? "Tune This Plan" : "View Picks"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
