import { NextResponse } from "next/server";
import { apiErrorResponse, rateLimit, readValidatedJson } from "@/lib/api-security";
import { plannerInputSchema } from "@/lib/planner-validation";
import { generatePlannerResponse } from "@/lib/planner-service";
import { PlannerInput } from "@/types/planner";

export async function POST(request: Request) {
  const limited = await rateLimit(request, "planner", 30, 10 * 60 * 1_000);
  if (limited) return limited;

  let input: PlannerInput;
  try {
    input = await readValidatedJson(request, plannerInputSchema, 16_384);
  } catch (error) {
    return apiErrorResponse(error);
  }
  try {
    return NextResponse.json(await generatePlannerResponse(input));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The planner could not build this trip yet.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
