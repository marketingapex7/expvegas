import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { apiErrorResponse, rateLimit, readValidatedJson } from "@/lib/api-security";
import { savePlanRequestSchema } from "@/lib/planner-validation";

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
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({
      shareToken,
      expiresAt,
    });
  } catch (error) {
    console.error("Plan save configuration failed", error);
    return NextResponse.json({ error: "Supabase is not configured for saving plans." }, { status: 503 });
  }
}
