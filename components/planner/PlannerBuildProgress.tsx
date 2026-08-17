import { RefObject } from "react";
import { Loader2 } from "lucide-react";
import { buildSteps } from "@/components/planner/options";

/** Shown while a plan builds, so the wait reads as work rather than a hang. */
export function PlannerBuildProgress({
  panelRef,
  progress,
  stepIndex,
  travelDatesLabel,
  selections,
}: {
  panelRef: RefObject<HTMLDivElement | null>;
  progress: number;
  stepIndex: number;
  travelDatesLabel: string;
  selections: string[];
}) {
  const shownSelections =
    selections.length > 0 ? selections : ["Flexible trip details", "Balanced Vegas pace", "Worth-booking anchor"];

  return (
    <div
      ref={panelRef}
      className="mx-auto mt-8 min-h-[32rem] scroll-mt-24 overflow-hidden rounded-lg border border-amber-100/20 bg-amber-100/[0.08] p-5 shadow-2xl shadow-black/30 sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black text-amber-100">
            <Loader2 className="h-4 w-4 animate-spin" /> Planning your Vegas trip
          </p>
          <h3 className="mt-3 text-2xl font-black text-white">Trip dates locked: {travelDatesLabel}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            We are turning your trip inputs into a timed plan with live events, food, free stops, timing buffers, and booking priorities.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-right">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Progress</p>
          <p className="mt-1 text-2xl font-black text-white">{progress}%</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/35">
        <div className="h-full rounded-full bg-amber-200 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg bg-black/25 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">Analyzing selections</p>
          <div data-testid="planner-analysis-selections" className="mt-3 flex flex-wrap items-start gap-2">
            {shownSelections.map((selection, index) => (
              <span
                key={selection}
                className={`max-w-full whitespace-normal break-words rounded-2xl px-3 py-2 text-xs font-bold leading-5 transition ${
                  index === stepIndex % Math.max(selections.length, 1)
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
                  index <= stepIndex
                    ? "border-amber-100/25 bg-amber-100/[0.08] text-white"
                    : "border-white/10 bg-white/[0.03] text-white/40"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${index <= stepIndex ? "bg-amber-200" : "bg-white/20"}`} />
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
