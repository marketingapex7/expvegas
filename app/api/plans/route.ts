import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { apiErrorResponse, rateLimit, readValidatedJson } from "@/lib/api-security";
import { savePlanRequestSchema } from "@/lib/planner-validation";

/**
 * Classifies a Supabase failure into an operator-facing diagnostic and a
 * visitor-facing message.
 *
 * The diagnostic names our table, schema state, and project status, so it goes
 * to the server log only. Returning it to the browser told anyone who could
 * POST here which backend we run, whether its schema was current, and whether
 * the project was paused. Clients get a stable code they can branch on and
 * quote in a support request; nothing about the infrastructure.
 */
function classifyPlanSaveError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() || "";

  if (message.includes("invalid api key") || message.includes("jwt")) {
    return {
      code: "SUPABASE_KEY_REJECTED",
      diagnostic: "Supabase rejected the server key. Verify that the Supabase URL and secret key belong to the same project.",
    };
  }

  if (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    ((message.includes("table") || message.includes("relation")) && message.includes("plans"))
  ) {
    return {
      code: "PLANS_TABLE_MISSING",
      diagnostic: "The Supabase plans table is missing. Run supabase/plans.sql in this project's SQL Editor.",
    };
  }

  if (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("project is paused") ||
    message.includes("project not found")
  ) {
    return {
      code: "SUPABASE_UNREACHABLE",
      diagnostic: "The configured Supabase project could not be reached. Confirm the project is active and the Supabase URL is current.",
    };
  }

  if (error.code === "42501" || message.includes("permission denied") || message.includes("row-level security")) {
    return {
      code: "PLAN_INSERT_DENIED",
      diagnostic: "Supabase denied the plan insert. Verify the server secret key and plans table permissions.",
    };
  }

  if (error.code === "42703" || message.includes("column")) {
    return {
      code: "PLANS_SCHEMA_OUTDATED",
      diagnostic: "The Supabase plans table schema is out of date. Re-run supabase/plans.sql in the SQL Editor.",
    };
  }

  return {
    code: error.code || "PLAN_SAVE_FAILED",
    diagnostic: "The plan insert failed for an unrecognized reason.",
  };
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "plans:create", 30, 10 * 60 * 1_000);
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
      const { code, diagnostic } = classifyPlanSaveError(error);
      console.error(`Plan save failed [${code}] ${diagnostic}`, error);
      return NextResponse.json(
        { error: "The plan could not be saved right now.", code },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
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
