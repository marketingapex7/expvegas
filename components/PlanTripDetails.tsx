import { MapPin } from "lucide-react";
import { PlannerResponse } from "@/types/planner";

export function PlanTripDetails({ result }: { result: PlannerResponse }) {
  const summary = result.tripSummary;

  return (
    <div className="text-zinc-950">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-fuchsia-800">Why this plan works</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{summary?.whyThisPlanWorks || result.whyItFits}</p>

      {summary?.bestLodgingZone ? (
        <div className="mt-4 border-l-2 border-amber-400 pl-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Best lodging zone</p>
          <p className="mt-1 text-sm leading-6 text-zinc-700">{summary.bestLodgingZone}</p>
        </div>
      ) : null}

      {summary?.assumptions?.length ? (
        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Assumptions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.assumptions.map((assumption) => (
              <span key={assumption} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600">{assumption}</span>
            ))}
          </div>
        </div>
      ) : null}

      {summary?.keepFlexible.length ? (
        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Keep flexible</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-600">
            {summary.keepFlexible.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex items-start gap-2 border-t border-zinc-200 pt-4">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-800" />
        <p className="text-xs leading-5 text-zinc-500">Timing, prices, hours, and availability can change. Confirm details with the venue before booking.</p>
      </div>
      {result.sourceSummary ? <p className="mt-3 text-xs font-bold text-zinc-400">{result.sourceSummary}</p> : null}
    </div>
  );
}
