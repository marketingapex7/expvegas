import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { PlannerInput, PlannerResponse } from "@/types/planner";

type RouteContext = {
  params: Promise<{ token: string }>;
};

type StoredPlan = {
  share_token: string;
  created_at: string;
  expires_at: string;
  email: string | null;
  input_json: PlannerInput;
  result_json: PlannerResponse;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("plans")
      .select("share_token, created_at, expires_at, email, input_json, result_json")
      .eq("share_token", token)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .single<StoredPlan>();

    if (error || !data) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    return NextResponse.json({
      shareToken: data.share_token,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      email: data.email,
      input: data.input_json,
      result: data.result_json,
    });
  } catch {
    return NextResponse.json({ error: "Supabase is not configured for loading plans." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const body = (await request.json()) as { email?: string; result?: PlannerResponse };

  if (!body.email && !body.result) {
    return NextResponse.json({ error: "An email or updated plan is required." }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Supabase is not configured for updating plans." }, { status: 503 });
  }
}
