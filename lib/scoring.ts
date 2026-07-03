import { VegasEvent } from "@/types/event";
import { PlannerInput } from "@/types/planner";

const groupScoreMap: Record<string, keyof VegasEvent> = {
  couple: "couplesScore",
  family: "familyScore",
  bachelor: "bachelorScore",
  bachelorette: "bachelorScore",
};

export function scoreEvent(event: VegasEvent, input?: Partial<PlannerInput>) {
  let score = event.editorialScore * 0.35 + event.valueScore * 0.2 + event.wowScore * 0.2;

  const groupKey = input?.groupType?.toLowerCase() || "";
  const groupMetric = Object.entries(groupScoreMap).find(([key]) => groupKey.includes(key))?.[1];
  if (groupMetric) score += Number(event[groupMetric]) * 0.2;

  const vibe = input?.vibe?.toLowerCase() || "";
  for (const tag of event.tags) {
    if (vibe.includes(tag.replace("-", " ")) || vibe.includes(tag)) score += 8;
  }

  const near = input?.stayingNear?.toLowerCase() || "";
  if (near && (event.venueName.toLowerCase().includes(near) || event.area.toLowerCase().includes(near))) score += 15;

  const budget = input?.budget?.toLowerCase() || "";
  if (budget.includes("under") && event.priceMin && event.priceMin <= 100) score += 10;
  if (budget.includes("premium") && event.priceMin && event.priceMin >= 100) score += 8;

  return Math.round(score);
}

export function rankEvents(events: VegasEvent[], input?: Partial<PlannerInput>) {
  return [...events].sort((a, b) => scoreEvent(b, input) - scoreEvent(a, input));
}
