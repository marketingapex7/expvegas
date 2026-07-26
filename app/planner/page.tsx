import { HeroPlanner } from "@/components/HeroPlanner";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ refine?: string; budget?: string; arrival?: string; departure?: string }>;
}) {
  const params = await searchParams;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const initialDates = params.arrival && params.departure && datePattern.test(params.arrival) && datePattern.test(params.departure)
    ? { arrivalDate: params.arrival, departureDate: params.departure }
    : undefined;
  const budget = params.budget === "value"
    ? "Under $100 per person"
    : params.budget === "premium"
      ? "$350+ splurge"
      : params.budget === "mid"
        ? "$100-$200 per person"
        : undefined;

  return <HeroPlanner compact startAtRefinement={params.refine === "1"} initialBudget={budget} initialDates={initialDates} />;
}
