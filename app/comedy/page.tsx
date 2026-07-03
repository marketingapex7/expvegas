import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { getEventsByCategory } from "@/data/seed-events";

export const metadata = { title: "Best Las Vegas Comedy | ExperienceVegas" };

export default function ComedyPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Comedy" title="Best comedy shows in Las Vegas" description="Stand-up, adult comedy, group-friendly laughs, and lower-budget night-out picks." />
        <EventGrid events={getEventsByCategory("comedy")} />
      </div>
    </section>
  );
}
