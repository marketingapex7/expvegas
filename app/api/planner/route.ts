import { NextResponse } from "next/server";
import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";
import { PlannerInput, PlannerOutput } from "@/types/planner";

export async function POST(request: Request) {
  const input = (await request.json()) as PlannerInput;
  const ranked = rankEvents(seedEvents, input);
  const best = ranked[0];
  const backups = ranked.slice(1, 4);

  const output: PlannerOutput & { bestPickName: string; backupPickNames: string[] } = {
    headline: "Your Best Vegas Night",
    bestPickId: best.id,
    bestPickName: best.name,
    whyItFits: `${best.name} is the best first-pass match for a ${input.groupType || "Vegas"} trip with a ${input.vibe || "fun"} vibe and ${input.budget || "flexible"} budget.`,
    timeline: [
      { time: "6:00 PM", title: `Dinner or drinks near ${best.venueName}` },
      { time: "8:00 PM", title: best.name, description: best.quickVerdict },
      { time: "9:45 PM", title: "Walkable drinks or late-night add-on" },
    ],
    backupPickIds: backups.map((event) => event.id),
    backupPickNames: backups.map((event) => event.name),
    cheaperVersion: ranked.find((event) => event.priceMin && event.priceMin < 60)?.name,
    premiumVersion: ranked.find((event) => event.priceMin && event.priceMin >= 100)?.name,
    avoid: input.dealbreakers ? [`Avoid anything matching: ${input.dealbreakers}`] : [],
  };

  return NextResponse.json(output);
}
