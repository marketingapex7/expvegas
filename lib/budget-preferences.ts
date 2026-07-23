import { VegasEvent } from "@/types/event";

export type TicketBudgetBand = "under-100" | "100-200" | "200-350" | "350-plus";
export type MealPriceLevel = "value" | "mid" | "premium";

export function ticketBandsFromText(text = ""): TicketBudgetBand[] {
  const normalized = text.toLowerCase().replaceAll("–", "-");
  const bands: TicketBudgetBand[] = [];

  if (normalized.includes("under $100")) bands.push("under-100");
  if (normalized.includes("$100-$200")) bands.push("100-200");
  if (normalized.includes("$200-$350")) bands.push("200-350");
  if (normalized.includes("$350+") || normalized.includes("splurge")) bands.push("350-plus");
  if (bands.length === 0 && normalized.includes("premium")) bands.push("200-350", "350-plus");

  return bands;
}

export function eventMatchesTicketBand(event: VegasEvent, band: TicketBudgetBand) {
  if (event.priceMin === undefined) return false;
  if (band === "under-100") return event.priceMin < 100;
  if (band === "100-200") return event.priceMin >= 100 && event.priceMin < 200;
  if (band === "200-350") return event.priceMin >= 200 && event.priceMin < 350;
  return event.priceMin >= 350;
}

export function diversifyEventsByTicketBudget(events: VegasEvent[], budgetText = "") {
  const bands = ticketBandsFromText(budgetText);
  if (bands.length < 2) return [...events];

  const diversified: VegasEvent[] = [];
  for (const band of bands) {
    const match = events.find((event) => eventMatchesTicketBand(event, band));
    if (match && !diversified.some((event) => event.id === match.id)) diversified.push(match);
  }

  return [...diversified, ...events.filter((event) => !diversified.some((picked) => picked.id === event.id))];
}

export function mealLevelsFromText(text = ""): MealPriceLevel[] {
  const normalized = text.toLowerCase().replaceAll("–", "-");
  const levels: MealPriceLevel[] = [];

  if (
    normalized.includes("under $30") ||
    normalized.includes("under $40") ||
    normalized.includes("cheap") ||
    normalized.includes("value")
  ) {
    levels.push("value");
  }
  if (normalized.includes("$30-$60") || normalized.includes("$40-$80") || normalized.includes("balanced")) {
    levels.push("mid");
  }
  if (
    normalized.includes("$60-$120") ||
    normalized.includes("$80-$150") ||
    normalized.includes("$120+") ||
    normalized.includes("premium") ||
    normalized.includes("splurge")
  ) {
    levels.push("premium");
  }

  return [...new Set(levels)];
}
