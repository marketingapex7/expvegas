/**
 * The question set the planner asks, shared by every entry point that asks it.
 * The homepage and the planner page both render these, and a trip planned from
 * one has to be the same trip planned from the other, so the options live here
 * rather than being spelled out twice.
 */
export const preferenceOptions = {
  ticketBudget: ["Under $100 per person", "$100-$200 per person", "$200-$350 per person", "$350+ splurge"],
  group: ["couple", "friends trip", "family with teens", "bachelor party"],
  lodging: ["haven't booked lodging yet", "center Strip", "near Bellagio", "near Caesars", "near Sphere", "near T-Mobile Arena", "Downtown"],
  vibe: ["big Vegas spectacle", "easy laughs", "sports energy", "not too touristy"],
  food: ["Steakhouse", "Buffet", "Celebrity chef", "Casual and fast", "Italian", "Asian", "Mexican", "Cheap eats", "Surprise me"],
  foodSpend: ["Under $30 per person", "$30-$60 per person", "$60-$120 per person", "$120+ splurge meal"],
  gambling: ["No gambling", "Casino atmosphere only", "Bankroll under $100", "Bankroll $100-$300", "Bankroll $300-$750", "Bankroll $750+", "Slots", "Table games", "Poker", "Sportsbook"],
  pace: ["Packed schedule", "Balanced", "Slow mornings", "Late nights", "Family-friendly pace"],
  logistics: ["Keep it walkable", "Rideshares are fine", "Stay near hotel", "Avoid long lines"],
} as const;

/**
 * Picking a bankroll and picking "no gambling" are contradictions rather than a
 * mix, so these two clear the rest of the group instead of adding to it.
 */
export const exclusiveGamblingOptions = ["No gambling", "Casino atmosphere only"];

export function toggleGamblingSelection(values: string[], option: string) {
  if (exclusiveGamblingOptions.includes(option)) {
    return values.includes(option) ? [] : [option];
  }

  const compatible = values.filter((value) => !exclusiveGamblingOptions.includes(value));
  return compatible.includes(option) ? compatible.filter((value) => value !== option) : [...compatible, option];
}

/**
 * Several selections in one group are an instruction to spread across them, not
 * a list to pick one from, so they are handed to the engine as a sentence.
 */
export function mixedSelectionText(kind: "ticket" | "meal" | "gambling", values: string[]) {
  if (values.length === 0) return undefined;
  if (kind === "gambling" && values.length === 1 && values[0] === "No gambling") return "No gambling";
  if (kind === "gambling" && values.length === 1 && values[0] === "Casino atmosphere only") {
    return "Casino atmosphere only, with no gambling bankroll";
  }

  const label = kind === "ticket" ? "ticket options" : kind === "meal" ? "meals" : "gambling preferences";
  return `Mix ${label} across ${values.join(" and ")}; include choices from each selection when available`;
}
