import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { getEventsByCategory } from "@/data/seed-events";

export const metadata = { title: "Best Las Vegas Attractions | ExperienceVegas" };

export default function AttractionsPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Attractions" title="Vegas attractions worth adding to the plan" description="Views, immersive experiences, family picks, late-night add-ons, and tours." />
        <EventGrid events={getEventsByCategory("attractions")} />
      </div>
    </section>
  );
}
