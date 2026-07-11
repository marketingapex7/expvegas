import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailPage } from "@/components/EventDetailPage";
import { getEventBySlug, seedEvents } from "@/data/seed-events";
import { buildEventMetadata } from "@/lib/event-seo";
import { rankEvents } from "@/lib/scoring";

export function generateStaticParams() {
  return seedEvents.filter((event) => event.category === "attractions").map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  return event && event.category === "attractions" ? buildEventMetadata(event, `/attractions/${slug}`) : {};
}

export default async function AttractionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event || event.category !== "attractions") notFound();
  const similar = rankEvents(seedEvents.filter((item) => item.id !== event.id)).slice(0, 3);
  return <EventDetailPage event={event} similar={similar} path={`/attractions/${slug}`} />;
}
