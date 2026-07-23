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

export function calculateTripBudget(items: TripPick[], settings: TripSettings, dates: TripDates) {
  const categories: Record<BudgetCategory, CostRange> = {
    Stay: { min: 0, max: 0 },
    Tickets: { min: 0, max: 0 },
    Food: { min: 0, max: 0 },
    Experiences: { min: 0, max: 0 },
  };
  const days = tripDayCount(dates);

  for (const item of items) {
    const amount = estimateTripItem(item, settings, days);
    const category = budgetCategoryByPick[item.category];
    categories[category].min += amount.min;
    categories[category].max += amount.max;
  }

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
