import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { apiErrorResponse, rateLimit, readValidatedJson } from "@/lib/api-security";
import { savePlanRequestSchema } from "@/lib/planner-validation";

function publicPlanSaveError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() || "";

  if (message.includes("invalid api key") || message.includes("jwt")) {
    return {
      error: "Supabase rejected the server key. Verify that the Supabase URL and secret key belong to the same project.",
      code: "SUPABASE_KEY_REJECTED",
    };
  }

  if (error.code === "PGRST205" || (message.includes("table") && message.includes("plans"))) {
    return {
      error: "The Supabase plans table is missing. Run supabase/plans.sql in this project's SQL Editor.",
      code: "PLANS_TABLE_MISSING",
    };
  }

  if (error.code === "42501" || message.includes("permission denied") || message.includes("row-level security")) {
    return {
      error: "Supabase denied the plan insert. Verify the server secret key and plans table permissions.",
      code: "PLAN_INSERT_DENIED",
    };
  }

  if (error.code === "42703" || message.includes("column")) {
    return {
      error: "The Supabase plans table schema is out of date. Re-run supabase/plans.sql in the SQL Editor.",
      code: "PLANS_SCHEMA_OUTDATED",
    };
  }

  return {
    error: "The plan could not be saved right now.",
    code: error.code || "PLAN_SAVE_FAILED",
  };
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "plans:create", 30, 10 * 60 * 1_000);
  if (limited) return limited;

  let body;
  try {
    body = await readValidatedJson(request, savePlanRequestSchema, 262_144);
  } catch (error) {
    return apiErrorResponse(error);
  }

  const shareToken = randomBytes(18).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("plans")
      .insert({
        share_token: shareToken,
        expires_at: expiresAt,
        input_json: body.input,
        result_json: body.result,
        email: body.email || null,
      });

    if (error) {
      console.error("Plan save failed", error);
      return NextResponse.json(publicPlanSaveError(error), { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({
      shareToken,
      expiresAt,
    });
  } catch (error) {
    console.error("Plan save configuration failed", error);
    return NextResponse.json({ error: "Plan saving is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
