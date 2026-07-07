import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { PlannerInput, PlannerResponse } from "@/types/planner";

type SavePlanRequest = {
  input: PlannerInput;
  result: PlannerResponse;
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SavePlanRequest;

  if (!body.input || !body.result) {
    return NextResponse.json({ error: "Plan input and result are required." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("plans")
      .insert({
        input_json: body.input,
        result_json: body.result,
        email: body.email || null,
      })
      .select("share_token, expires_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      shareToken: data.share_token as string,
      expiresAt: data.expires_at as string,
    });
  } catch {
    return NextResponse.json({ error: "Supabase is not configured for saving plans." }, { status: 503 });
  }
}
