import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { seedEvents } from "@/data/seed-events";
import { rankEvents } from "@/lib/scoring";

export const metadata = { title: "Best Things To Do in Vegas Tonight | ExperienceVegas" };

export default function TonightPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Tonight" title="Best things to do in Vegas tonight" description="A decision-first page for last-minute shows, comedy, sports, concerts, and attractions. API inventory comes next." />
        <EventGrid events={rankEvents(seedEvents)} />
      </div>
    </section>
  );
}
