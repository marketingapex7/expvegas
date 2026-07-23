import { SectionHeader } from "@/components/SectionHeader";
import { TonightFilters } from "@/components/TonightFilters";
import { getLiveVegasEvents, getVegasToday } from "@/lib/live-events";

export const revalidate = 1800;

export const metadata = {
  title: "Things To Do in Las Vegas Tonight",
  description: "Compare live Las Vegas events scheduled tonight, including shows, comedy, concerts, sports, and attractions.",
  alternates: { canonical: "/tonight" },
};

export default async function TonightPage() {
  const result = await getLiveVegasEvents(getVegasToday());
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={result.isLive ? "Live schedule" : "Curated fallback"}
          title="Best things to do in Vegas tonight"
          description={result.isLive
            ? "Live events scheduled in Las Vegas tonight, ranked for quick last-minute decisions across shows, comedy, sports, concerts, and attractions."
            : "Live inventory is temporarily unavailable. These editorial picks are worth considering, but confirm the date and availability before booking."}
        />
        <TonightFilters events={result.events} isLive={result.isLive} />
      </div>
    </section>
  );
}
