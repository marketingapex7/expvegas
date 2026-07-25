import { HeroPlanner } from "@/components/HeroPlanner";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ refine?: string; budget?: string }>;
}) {
  const params = await searchParams;
  const budget = params.budget === "value"
    ? "Under $100 per person"
    : params.budget === "premium"
      ? "$350+ splurge"
      : params.budget === "mid"
        ? "$100-$200 per person"
        : undefined;

  return <HeroPlanner compact startAtRefinement={params.refine === "1"} initialBudget={budget} />;
}
