import { DirectoryCategory, TripDates, TripPick, TripSettings } from "@/types/directory";

export type BudgetCategory = "Stay" | "Tickets" | "Food" | "Experiences";

export type CostRange = {
  min: number;
  max: number;
};

const budgetCategoryByPick: Record<DirectoryCategory, BudgetCategory> = {
  hotel: "Stay",
  event: "Tickets",
  restaurant: "Food",
  attraction: "Experiences",
  free: "Experiences",
  shopping: "Experiences",
};

export function tripDayCount(dates: TripDates) {
  if (!dates.arrivalDate || !dates.departureDate) return 1;
  return Math.max(
    1,
    Math.round(
      (Date.parse(`${dates.departureDate}T00:00:00Z`) - Date.parse(`${dates.arrivalDate}T00:00:00Z`)) /
        86_400_000,
    ),
  );
}

export function estimateTripItem(item: TripPick, settings: TripSettings, days: number): CostRange {
  if (item.status === "backup" || item.costUnit === "free") return { min: 0, max: 0 };
  const min = item.estimatedCostMin || 0;
  const max = item.estimatedCostMax ?? min;
  const multiplier =
    item.costUnit === "per-night" ? days : item.costUnit === "per-person" ? settings.partySize : 1;
  return { min: min * multiplier, max: max * multiplier };
}

export function estimateGoCityItems(items: TripPick[], partySize: number): CostRange {
  if (items.length === 0) return { min: 0, max: 0 };

  const individualRetail = items.reduce((sum, item) => sum + (item.estimatedCostMax || item.estimatedCostMin || 0), 0);
  if (items.length < 3) {
    return { min: individualRetail * partySize, max: individualRetail * partySize };
  }

  const requiresAllInclusive = items.some((item) => item.passTypes?.length === 1 && item.passTypes[0] === "all-inclusive");
  const allSupportEssentials = items.every((item) => item.passTypes?.includes("essentials"));
  let perPerson: CostRange;

  if (requiresAllInclusive || items.length > 7) {
    perPerson = { min: 169, max: 269 };
  } else if (allSupportEssentials && items.length <= 3) {
    perPerson = { min: 79, max: 79 };
  } else {
    const explorerPrices: Record<number, number> = { 3: 99, 4: 119, 5: 129, 6: 139, 7: 149 };
    const passPrice = explorerPrices[Math.min(7, items.length)];
    perPerson = { min: Math.min(passPrice, individualRetail), max: passPrice };
  }

  return { min: perPerson.min * partySize, max: perPerson.max * partySize };
}

export function calculateTripBudget(items: TripPick[], settings: TripSettings, dates: TripDates) {
  const categories: Record<BudgetCategory, CostRange> = {
    Stay: { min: 0, max: 0 },
    Tickets: { min: 0, max: 0 },
    Food: { min: 0, max: 0 },
    Experiences: { min: 0, max: 0 },
  };
  const days = tripDayCount(dates);

  const goCityItems = items.filter((item) => item.provider === "go-city" && item.status !== "backup");

  for (const item of items.filter((item) => item.provider !== "go-city")) {
    const amount = estimateTripItem(item, settings, days);
    const category = budgetCategoryByPick[item.category];
    categories[category].min += amount.min;
    categories[category].max += amount.max;
  }
  const goCityAmount = estimateGoCityItems(goCityItems, settings.partySize);
  categories.Experiences.min += goCityAmount.min;
  categories.Experiences.max += goCityAmount.max;

  const total = Object.values(categories).reduce(
    (sum, amount) => ({ min: sum.min + amount.min, max: sum.max + amount.max }),
    { min: 0, max: 0 },
  );

  return { total, categories, days };
}

export function formatCostRange(cost: CostRange) {
  const min = Math.round(cost.min);
  const max = Math.round(cost.max);
  return min === max ? `$${min.toLocaleString()}` : `$${min.toLocaleString()}-$${max.toLocaleString()}`;
}
