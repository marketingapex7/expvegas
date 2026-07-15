import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { apiErrorResponse, rateLimit, readValidatedJson, validShareToken } from "@/lib/api-security";
import { updatePlanRequestSchema } from "@/lib/planner-validation";
import { PlannerInput, PlannerResponse } from "@/types/planner";

type RouteContext = {
  params: Promise<{ token: string }>;
};

type StoredPlan = {
  share_token: string;
  created_at: string;
  expires_at: string;
  input_json: PlannerInput;
  result_json: PlannerResponse;
};

export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!validShareToken(token)) return NextResponse.json({ error: "Invalid plan link." }, { status: 400 });
  const limited = rateLimit(request, "plans:read", 120, 10 * 60 * 1_000);
  if (limited) return limited;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("plans")
      .select("share_token, created_at, expires_at, input_json, result_json")
      .eq("share_token", token)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .single<StoredPlan>();

    if (error || !data) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        shareToken: data.share_token,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        input: data.input_json,
        result: data.result_json,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Supabase is not configured for loading plans." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!validShareToken(token)) return NextResponse.json({ error: "Invalid plan link." }, { status: 400 });
  const limited = rateLimit(request, "plans:update", 60, 10 * 60 * 1_000);
  if (limited) return limited;

  let body;
  try {
    body = await readValidatedJson(request, updatePlanRequestSchema, 262_144);
  } catch (error) {
    return apiErrorResponse(error);
  }

  try {
    const supabase = getSupabaseAdmin();
    const updates: { email?: string; result_json?: PlannerResponse; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (body.email) updates.email = body.email.trim();
    if (body.result) updates.result_json = body.result;

    const { error } = await supabase
      .from("plans")
      .update(updates)
      .eq("share_token", token)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Plan update failed", error);
      return NextResponse.json({ error: "The plan could not be updated right now." }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Supabase is not configured for updating plans." }, { status: 503 });
  }
}
