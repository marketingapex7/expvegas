import { VegasEvent } from "@/types/event";
import { PlannerInput } from "@/types/planner";
import { eventMatchesTicketBand, ticketBandsFromText } from "@/lib/budget-preferences";
import { GroupKind, groupKindFrom } from "@/lib/planner-preferences";

// One definition of what each group answer means, shared with the itinerary
// engine so "family" cannot mean one thing here and another there.
// "friends" has no dedicated metric, so it is deliberately absent and scores on
// editorial, value, and wow alone -- the same as before this map was typed.
const groupScoreMap: Partial<Record<GroupKind, keyof VegasEvent>> = {
  couple: "couplesScore",
  family: "familyScore",
  bachelor: "bachelorScore",
};

const NON_HEADLINE_EVENT_PATTERN =
  /\b(pop[- ]?up|merch(?:andise)?|shop|parking|vip package|add-on|upgrade|hospitality|meet and greet)\b/i;

// Age gates show up in listing names and notes ("(21+ Event)", "ages 21 and
// over"). A family plan must never anchor a day on one of these.
const AGE_RESTRICTED_EVENT_PATTERN = /(\b(?:21|18)\s*\+)|(\b(?:21|18)\s*(?:and|&)\s*(?:over|up)\b)|(\bages?\s*(?:21|18)\b)/i;

export function isHeadlineEvent(event: VegasEvent) {
  const text = `${event.name} ${event.subcategory || ""} ${event.shortDescription}`;
  return !NON_HEADLINE_EVENT_PATTERN.test(text);
}

export function isAgeRestrictedEvent(event: VegasEvent) {
  const text = `${event.name} ${event.subcategory || ""} ${event.shortDescription} ${event.ageRestriction || ""}`;
  return AGE_RESTRICTED_EVENT_PATTERN.test(text);
}

export function scoreEvent(event: VegasEvent, input?: Partial<PlannerInput>) {
  let score = event.editorialScore * 0.35 + event.valueScore * 0.2 + event.wowScore * 0.2;
  if (!isHeadlineEvent(event)) score -= 100;

  const group = groupKindFrom(input?.groupType);
  const groupMetric = groupScoreMap[group];
  if (groupMetric) score += Number(event[groupMetric]) * 0.2;
  // Rank age-gated events to the bottom for family groups so they stay out of
  // the comparison shelf as well as the anchor slot.
  if (group === "family" && isAgeRestrictedEvent(event)) score -= 100;

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
