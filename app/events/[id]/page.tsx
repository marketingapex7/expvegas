import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailPage } from "@/components/EventDetailPage";
import { seedEvents } from "@/data/seed-events";
import { buildEventMetadata } from "@/lib/event-seo";
import { rankEvents } from "@/lib/scoring";
import { getTicketmasterEvent } from "@/lib/ticketmaster";

export const revalidate = 1800;

async function loadEvent(id: string) {
  try {
    return await getTicketmasterEvent(id);
  } catch (error) {
    console.error("Ticketmaster event detail unavailable", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await loadEvent(id);
  if (!event) return { title: "Event Not Found", robots: { index: false, follow: false } };
  return buildEventMetadata(event, `/events/${id}`);
}

export default async function LiveEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadEvent(id);
  if (!event) notFound();
  const similar = rankEvents(seedEvents.filter((item) => item.category === event.category)).slice(0, 3);
  return <EventDetailPage event={event} similar={similar.length ? similar : rankEvents(seedEvents).slice(0, 3)} path={`/events/${id}`} />;
}
