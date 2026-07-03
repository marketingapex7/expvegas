import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { nearLinks } from "@/data/nav";
import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";

export function generateStaticParams() {
  return nearLinks.map((link) => ({ slug: link.href.split("/").pop() }));
}

export default async function NearPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Near" title={`Best things to do near ${label}`} description="Hotel and venue pages are a key long-tail SEO wedge for ExperienceVegas." />
        <EventGrid events={rankEvents(seedEvents)} />
      </div>
    </section>
  );
}
