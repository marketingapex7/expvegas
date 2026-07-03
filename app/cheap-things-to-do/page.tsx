import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";

export const metadata = { title: "Cheap Things To Do in Las Vegas | ExperienceVegas" };

export default function CheapThingsPage() {
  const cheapEvents = rankEvents(seedEvents).filter((event) => (event.priceMin || 999) <= 100);
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Cheap Vegas" title="Cheap things to do in Vegas that still feel worth it" description="Lower-budget shows, comedy, attractions, and easy add-ons for visitors trying not to light money on fire." />
        <EventGrid events={cheapEvents} />
      </div>
    </section>
  );
}
