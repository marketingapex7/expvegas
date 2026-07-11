import { EventGrid } from "@/components/EventGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { getLiveVegasEvents, getVegasWeekend } from "@/lib/live-events";

export const revalidate = 1800;

export const metadata = {
  title: "Things To Do in Las Vegas This Weekend",
  description: "Compare live Las Vegas shows, concerts, comedy, sports, and attractions scheduled this weekend.",
  alternates: { canonical: "/this-weekend" },
};

export default async function ThisWeekendPage() {
  const weekend = getVegasWeekend();
  const result = await getLiveVegasEvents(weekend.startDate, weekend.endDate, 30);
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={result.isLive ? "Live weekend schedule" : "Curated fallback"}
          title="Best Vegas picks for this weekend"
          description={result.isLive
            ? "Scheduled events from Friday through Sunday, ranked to make shows, comedy, concerts, sports, attractions, and value picks easier to compare."
            : "Live inventory is temporarily unavailable. Browse these editorial recommendations, then confirm the event date before booking."}
        />
        <EventGrid events={result.events} />
      </div>
    </section>
  );
}
