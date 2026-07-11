import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntentLandingPage } from "@/components/IntentLandingPage";
import { nearIntentPages } from "@/data/intent-pages";
import { getEventBySlug } from "@/data/seed-events";

export function generateStaticParams() {
  return Object.keys(nearIntentPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = nearIntentPages[slug];
  if (!content) return {};
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: `/near/${slug}` },
  };
}

export default async function NearPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = nearIntentPages[slug];
  if (!content) notFound();
  const events = content.eventSlugs.map(getEventBySlug).filter((event) => event !== undefined);
  return <IntentLandingPage eyebrow="Plan by location" content={content} events={events} />;
}
