import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntentLandingPage } from "@/components/IntentLandingPage";
import { bestIntentPages } from "@/data/intent-pages";
import { getEventBySlug } from "@/data/seed-events";

export function generateStaticParams() {
  return Object.keys(bestIntentPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = bestIntentPages[slug];
  if (!content) return {};
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: `/best/${slug}` },
  };
}

export default async function BestForPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = bestIntentPages[slug];
  if (!content) notFound();
  const events = content.eventSlugs.map(getEventBySlug).filter((event) => event !== undefined);
  return <IntentLandingPage eyebrow="Best for" content={content} events={events} />;
}
