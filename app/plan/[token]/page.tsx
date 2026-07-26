import type { Metadata } from "next";
import Link from "next/link";
import { PlanResult } from "@/components/PlanResult";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { validShareToken } from "@/lib/api-security";
import { PlannerResponse } from "@/types/planner";

export const dynamic = "force-dynamic";

type SavedPlanPageProps = {
  params: Promise<{ token: string }>;
};

type StoredPlan = {
  share_token: string;
  expires_at: string;
  result_json: PlannerResponse;
};

async function getSavedPlan(token: string) {
  if (!validShareToken(token)) return null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("plans")
      .select("share_token, expires_at, result_json")
      .eq("share_token", token)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .single<StoredPlan>();

    if (error || !data) return null;

    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: SavedPlanPageProps): Promise<Metadata> {
  const { token } = await params;
  const savedPlan = await getSavedPlan(token);
  const dayCount = savedPlan?.result_json.itineraryDays?.length ?? 0;
  const title = dayCount
    ? `Your ${dayCount}-Day Las Vegas Game Plan`
    : "Your Las Vegas Game Plan";
  const description = savedPlan
    ? `A personalized Vegas plan featuring ${savedPlan.result_json.bestPickName}, timed experiences, food, and practical stops.`
    : "This private Las Vegas game plan is unavailable. Build a new personalized trip plan with ExperienceVegas.";

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ExperienceVegas personalized Las Vegas game plan" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function SavedPlanPage({ params }: SavedPlanPageProps) {
  const { token } = await params;
  const savedPlan = await getSavedPlan(token);

  return (
    <section className="px-5 py-14">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10">
          Back to ExperienceVegas
        </Link>
        {savedPlan ? (
          <PlanResult result={savedPlan.result_json} shareUrl={`/plan/${savedPlan.share_token}`} expiresAt={savedPlan.expires_at} />
        ) : (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-100">Plan not found</p>
            <h1 className="mt-3 text-4xl font-black text-white">This Vegas game plan is unavailable.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-white/65">
              It may have expired, been removed, or the link may have been copied incorrectly. You can build a fresh plan in a minute.
            </p>
            <Link href="/" className="mt-5 inline-flex rounded-lg bg-amber-200 px-5 py-3 text-sm font-black text-black transition hover:bg-amber-100">
              Build a New Experience
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
