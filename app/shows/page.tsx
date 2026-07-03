import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { getEventsByCategory } from "@/data/seed-events";

export const metadata = { title: "Best Las Vegas Shows | ExperienceVegas" };

export default function ShowsPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Shows" title="Best Las Vegas shows worth booking" description="Production shows, adult comedy, Cirque-style spectacles, magic, and iconic Vegas nights." />
        <EventGrid events={getEventsByCategory("shows")} />
      </div>
    </section>
  );
}
