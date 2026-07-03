import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { bestForLinks } from "@/data/nav";
import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";

export function generateStaticParams() {
  return bestForLinks.map((link) => ({ slug: link.href.split("/").pop() }));
}

export default async function BestForPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Best For" title={`Best Vegas picks for ${label}`} description="These pages are designed around the visitor's trip intent instead of only the ticket category." />
        <EventGrid events={rankEvents(seedEvents)} />
      </div>
    </section>
  );
}
