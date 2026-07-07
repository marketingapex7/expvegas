"use client";

import { useState } from "react";
import { CalendarDays, Ticket } from "lucide-react";
import { PlannerResponse } from "@/types/planner";

function actionForCategory(category: string, bookingUrl?: string) {
  if (category === "event" && bookingUrl) return "Check Tickets";
  if (category === "meal") return "Reserve Table";
  if (category === "attraction") return "View Nearby";
  if (category === "casino") return "Map It";
  return "Swap Pick";
}

export function PlannerForm() {
  const [result, setResult] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const travelDates =
    arrivalDate && departureDate ? `${arrivalDate} to ${departureDate}` : arrivalDate || departureDate;

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
        <input type="hidden" name="travelDates" value={travelDates} />
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-white/75">
            <CalendarDays className="h-4 w-4 text-fuchsia-200" /> Travel dates
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
              Arrive
              <input
                type="date"
                value={arrivalDate}
                onChange={(event) => setArrivalDate(event.target.value)}
                className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white [color-scheme:dark] outline-none transition focus:border-fuchsia-200/60"
              />
            </label>
            <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
              Leave
              <input
                type="date"
                value={departureDate}
                onChange={(event) => setDepartureDate(event.target.value)}
                className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white [color-scheme:dark] outline-none transition focus:border-fuchsia-200/60"
              />
            </label>
          </div>
        </div>
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
          {loading ? "Building..." : "Build My Vegas Game Plan"}
        </button>
      </form>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
        {!result ? (
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-200">Vegas Game Plan</p>
            <h3 className="mt-3 text-3xl font-black text-white">A timed plan will appear here.</h3>
            <p className="mt-4 leading-7 text-white/65">It blends live events with curated food, attraction, casino, and logistics picks.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-200">{result.headline}</p>
              <h3 className="mt-3 text-4xl font-black text-white">{result.bestPickName}</h3>
              <p className="mt-4 leading-7 text-white/70">{result.whyItFits}</p>
              {result.sourceSummary ? <p className="mt-3 text-sm font-bold text-white/45">{result.sourceSummary}</p> : null}
            </div>
            <div>
              <p className="font-black text-white">Timed itinerary</p>
              {result.itineraryDays?.length ? (
                <div className="mt-3 grid gap-5">
                  {result.itineraryDays.map((day) => (
                    <section key={day.date} className="rounded-2xl bg-black/20 p-4">
                      <p className="text-sm font-black text-fuchsia-200">{day.label}</p>
                      <h4 className="mt-1 text-xl font-black text-white">{day.theme}</h4>
                      <div className="mt-4 grid gap-3">
                        {day.blocks.map((block) => (
                          <div key={`${day.date}-${block.time}-${block.title}`} className="rounded-2xl bg-black/25 p-4">
                            <p className="text-sm font-black text-fuchsia-200">{block.time}</p>
                            <p className="mt-1 font-bold text-white">{block.title}</p>
                            {block.location ? <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">{block.location}</p> : null}
                            {block.description ? <p className="mt-2 text-sm leading-6 text-white/60">{block.description}</p> : null}
                            {block.priceHint ? <p className="mt-2 text-sm font-bold text-white/70">{block.priceHint}</p> : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {block.bookingUrl ? (
                                <a href={block.bookingUrl} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-fuchsia-100">
                                  <Ticket className="h-3.5 w-3.5" /> {actionForCategory(block.category, block.bookingUrl)}
                                </a>
                              ) : (
                                <button type="button" className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white/72 transition hover:bg-white/10">
                                  {actionForCategory(block.category)}
                                </button>
                              )}
                              <button type="button" className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white/72 transition hover:bg-white/10">
                                Swap Pick
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="mt-3 grid gap-3">
                  {result.timeline.map((item) => (
                    <div key={`${item.time}-${item.title}`} className="rounded-2xl bg-black/25 p-4">
                      <p className="text-sm font-black text-fuchsia-200">{item.time}</p>
                      <p className="mt-1 font-bold text-white">{item.title}</p>
                      {item.description ? <p className="mt-1 text-sm text-white/60">{item.description}</p> : null}
                    </div>
                  ))}
                </div>
              )}
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
