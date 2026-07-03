import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { getEventsByCategory } from "@/data/seed-events";

export const metadata = { title: "Las Vegas Sports Tickets & Events | ExperienceVegas" };

export default function SportsPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Sports" title="Sports nights in Vegas" description="Raiders, Golden Knights, UFC, boxing, basketball, and major sports weekends." />
        <EventGrid events={getEventsByCategory("sports")} />
      </div>
    </section>
  );
}
