"use client";

import { useState } from "react";

type PlannerResponse = {
  headline: string;
  bestPickName: string;
  whyItFits: string;
  timeline: { time: string; title: string; description?: string }[];
  backupPickNames: string[];
  cheaperVersion?: string;
  premiumVersion?: string;
  avoid?: string[];
};

export function PlannerForm() {
  const [result, setResult] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setResult(await response.json());
    setLoading(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <form action={handleSubmit} className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
        <input name="travelDates" placeholder="Travel dates" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35" />
        <select name="groupType" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none">
          <option>Couple</option><option>Family</option><option>Friends trip</option><option>Bachelor party</option><option>Bachelorette party</option><option>Solo</option>
        </select>
        <select name="budget" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none">
          <option>Under $50</option><option>$50-$100</option><option>$100-$200</option><option>Premium</option>
        </select>
        <select name="vibe" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none">
          <option>Funny</option><option>Romantic</option><option>Wild</option><option>Iconic</option><option>Family-friendly</option><option>Sports</option>
        </select>
        <input name="stayingNear" placeholder="Staying near / hotel" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35" />
        <textarea name="dealbreakers" placeholder="Dealbreakers: no adult content, no long rides, no heights, etc." className="min-h-28 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35" />
        <button className="rounded-2xl bg-fuchsia-300 px-5 py-4 font-black text-black" disabled={loading}>
          {loading ? "Building..." : "Build My Vegas Plan"}
        </button>
      </form>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
        {!result ? (
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-200">Planner Output</p>
            <h3 className="mt-3 text-3xl font-black text-white">A concierge-style result will appear here.</h3>
            <p className="mt-4 leading-7 text-white/65">The first version uses local seed events and scoring. Later it will use live inventory plus LLM-written explanations.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-200">{result.headline}</p>
              <h3 className="mt-3 text-4xl font-black text-white">{result.bestPickName}</h3>
              <p className="mt-4 leading-7 text-white/70">{result.whyItFits}</p>
            </div>
            <div>
              <p className="font-black text-white">Suggested night</p>
              <div className="mt-3 grid gap-3">
                {result.timeline.map((item) => (
                  <div key={`${item.time}-${item.title}`} className="rounded-2xl bg-black/25 p-4">
                    <p className="text-sm font-black text-fuchsia-200">{item.time}</p>
                    <p className="mt-1 font-bold text-white">{item.title}</p>
                    {item.description ? <p className="mt-1 text-sm text-white/60">{item.description}</p> : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-black/25 p-4">
                <p className="font-black text-white">Backup picks</p>
                <p className="mt-2 text-sm text-white/65">{result.backupPickNames.join(" · ")}</p>
              </div>
              <div className="rounded-2xl bg-black/25 p-4">
                <p className="font-black text-white">Budget / premium</p>
                <p className="mt-2 text-sm text-white/65">Cheap: {result.cheaperVersion || "TBD"}</p>
                <p className="mt-1 text-sm text-white/65">Premium: {result.premiumVersion || "TBD"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
