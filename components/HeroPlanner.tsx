"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

const vibeOptions = ["Big spectacle", "Comedy", "Date night", "Family-friendly", "Sports", "Under $100", "Near Sphere", "No gambling"];
const itineraries = [
  {
    label: "Best Overall Night",
    title: "A polished Vegas night with one unforgettable anchor",
    plan: ["Dinner near Bellagio or Caesars", "Book a premium production show", "Walkable after-show drinks or Strip views"],
    fit: "Best when the group wants the classic Vegas wow factor without gambling.",
    budget: "$125-$220 per person",
    cta: "/shows",
  },
  {
    label: "Best Value Night",
    title: "Funny, flexible, and easier on the budget",
    plan: ["Start with a casual dinner", "Choose a strong comedy room or attraction", "Add a late Strip walk or lounge nearby"],
    fit: "Best for groups that want a real night out without premium show prices.",
    budget: "$45-$110 per person",
    cta: "/cheap-things-to-do",
  },
  {
    label: "Big Vegas Wow",
    title: "The high-impact plan people will talk about later",
    plan: ["Pick a visual spectacle or headline venue", "Stay close to the action", "Keep the after-plan simple and nearby"],
    fit: "Best for first-timers, couples, and visitors who want the trip to feel unmistakably Vegas.",
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
    <section className="relative overflow-hidden px-5 pb-12 pt-10 sm:pt-14 md:pb-16 lg:pt-18">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.2),transparent_58%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-start">
          <div className="max-w-3xl pt-3 lg:sticky lg:top-28">
            <p className="mb-5 inline-flex max-w-full rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-2 text-sm font-bold leading-6 text-fuchsia-100">
              Decision-first Vegas planning, not another ticket catalog.
            </p>
            <h1 className="text-4xl font-black leading-[1.02] text-white sm:text-5xl md:text-6xl">
              Tell us the trip. Get the Vegas nights worth booking.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl sm:leading-9">
              ExperienceVegas turns dates, group type, budget, location, and vibe into a few practical itineraries across shows, comedy, attractions, sports, and concerts.
            </p>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-3 text-center sm:text-left">
              <div>
                <p className="text-2xl font-black text-white">3</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Plan styles</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">60 sec</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Shortlist</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">Vegas</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Curated</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-5">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">AI Trip Finder</p>
                  <h2 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">What kind of Vegas trip are you planning?</h2>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-center text-black sm:min-w-24">
                  <p className="text-2xl font-black leading-none">1 min</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em]">plan</p>
                </div>
              </div>

              <label className="mt-5 grid gap-2 text-sm font-bold text-white/75">
                Tell us what you want
                <textarea
                  className="min-h-32 resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-fuchsia-200/60"
                  placeholder="Example: We are staying near Caesars this weekend, two couples, around $150 each, want something impressive but not too touristy."
                />
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  Dates
                  <input className="min-h-12 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-fuchsia-200/60" placeholder="Tonight, weekend, or dates" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  Staying near
                  <input className="min-h-12 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-fuchsia-200/60" placeholder="Sphere, Bellagio, MGM..." />
                </label>
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  Group
                  <select className="min-h-12 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-fuchsia-200/60">
                    <option>Couple</option><option>Friends trip</option><option>Family</option><option>Bachelor party</option><option>Bachelorette party</option><option>Solo</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  Budget
                  <select className="min-h-12 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-fuchsia-200/60">
                    <option>$50-$100 each</option><option>Under $50 each</option><option>$100-$200 each</option><option>Premium</option>
                  </select>
                </label>
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-white/75">Things you like</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vibeOptions.map((vibe) => {
                    const isSelected = selectedVibes.includes(vibe);

                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => toggleVibe(vibe)}
                        className={`rounded-full px-3 py-2 text-sm font-bold transition ${
                          isSelected ? "bg-fuchsia-300 text-black" : "bg-white/10 text-white/72 hover:bg-white/15"
                        }`}
                      >
                        {vibe}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button className="mt-5 w-full rounded-2xl bg-white px-5 py-4 font-black text-black transition hover:bg-fuchsia-100">
                Build My Vegas Itineraries
              </button>
              <p className="mt-3 text-center text-xs font-bold text-white/45">{summary}</p>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {itineraries.map((itinerary) => (
            <article key={itinerary.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 transition hover:-translate-y-1 hover:border-fuchsia-200/25 hover:bg-white/[0.09]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">{itinerary.label}</p>
              <h3 className="mt-3 text-2xl font-black leading-tight text-white">{itinerary.title}</h3>
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
                <Link href={itinerary.cta} className="rounded-full bg-fuchsia-300 px-4 py-2 text-center text-sm font-black text-black transition hover:bg-fuchsia-200">
                  {hasGenerated ? "Tune This Plan" : "View Picks"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
