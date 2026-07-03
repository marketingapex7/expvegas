import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { getEventsByCategory } from "@/data/seed-events";

export const metadata = { title: "Las Vegas Concerts | ExperienceVegas" };

export default function ConcertsPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Concerts" title="Concerts and residencies in Las Vegas" description="Sphere, Dolby Live, arena events, residencies, and one-night-only shows." />
        <EventGrid events={getEventsByCategory("concerts")} />
      </div>
    </section>
  );
}
