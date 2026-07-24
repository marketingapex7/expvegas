import { VegasEvent } from "@/types/event";
import { PlannerInput } from "@/types/planner";
import { eventMatchesTicketBand, ticketBandsFromText } from "@/lib/budget-preferences";

const groupScoreMap: Record<string, keyof VegasEvent> = {
  couple: "couplesScore",
  family: "familyScore",
  bachelor: "bachelorScore",
  bachelorette: "bachelorScore",
};

const NON_HEADLINE_EVENT_PATTERN =
  /\b(pop[- ]?up|merch(?:andise)?|shop|parking|vip package|add-on|upgrade|hospitality|meet and greet)\b/i;

export function isHeadlineEvent(event: VegasEvent) {
  const text = `${event.name} ${event.subcategory || ""} ${event.shortDescription}`;
  return !NON_HEADLINE_EVENT_PATTERN.test(text);
}

export function scoreEvent(event: VegasEvent, input?: Partial<PlannerInput>) {
  let score = event.editorialScore * 0.35 + event.valueScore * 0.2 + event.wowScore * 0.2;
  if (!isHeadlineEvent(event)) score -= 100;

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
  const selectedBands = ticketBandsFromText(budget);
  if (selectedBands.some((band) => eventMatchesTicketBand(event, band))) score += 10;

  return Math.round(score);
}

export function rankEvents(events: VegasEvent[], input?: Partial<PlannerInput>) {
  return [...events].sort((a, b) => scoreEvent(b, input) - scoreEvent(a, input));
}
