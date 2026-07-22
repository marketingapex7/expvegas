import { MapPin } from "lucide-react";
import { PlannerResponse } from "@/types/planner";

export function PlanTripDetails({ result }: { result: PlannerResponse }) {
  return (
    <>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">{result.headline}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight text-white">{result.bestPickName}</h2>
      <p className="mt-3 leading-7 text-white/70">{result.whyItFits}</p>
      {result.sourceSummary ? <p className="mt-3 text-sm font-bold text-white/45">{result.sourceSummary}</p> : null}

      {result.tripSummary ? (
        <section className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Trip summary</p>
              <p className="mt-3 text-sm leading-6 text-white/68">{result.tripSummary.whyThisPlanWorks}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Staying</p>
                  <p className="mt-2 text-sm font-black text-white">{result.tripSummary.lodging}</p>
                </div>
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Spend</p>
                  <p className="mt-2 text-sm font-black text-white">{result.tripSummary.estimatedSpend}</p>
                </div>
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Style</p>
                  <p className="mt-2 text-sm font-black text-white">{result.tripSummary.tripStyle.join(" / ")}</p>
                </div>
              </div>
              {result.tripSummary.bestLodgingZone ? (
                <div className="mt-3 rounded-lg border border-amber-100/20 bg-amber-100/[0.07] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">Best lodging zone</p>
                  <p className="mt-2 text-sm leading-6 text-white/72">{result.tripSummary.bestLodgingZone}</p>
                </div>
              ) : null}
              {result.tripSummary.assumptions?.length ? (
                <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Plan assumptions</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.tripSummary.assumptions.map((assumption) => (
                      <span key={assumption} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/65">
                        {assumption}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg bg-white/[0.06] p-4">
              <p className="text-sm font-black text-white">Keep flexible</p>
              {result.tripSummary.keepFlexible.length ? (
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  {result.tripSummary.keepFlexible.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-white/60">The open time in this plan can flex around energy, weather, and availability.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-5 rounded-lg border border-amber-100/15 bg-amber-100/[0.06] p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-100" />
          <p className="text-sm leading-6 text-white/65">
            Planning note: timing, prices, restaurant hours, and availability can change. Confirm the details with the venue before booking.
          </p>
        </div>
      </div>
    </>
  );
}
