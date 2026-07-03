import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";

export const metadata = { title: "Best Things To Do in Vegas This Weekend | ExperienceVegas" };

export default function ThisWeekendPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="This Weekend" title="Best Vegas picks for this weekend" description="The weekly money page for shows, comedy, concerts, sports, attractions, and value picks." />
        <EventGrid events={rankEvents(seedEvents)} />
      </div>
    </section>
  );
}
