import { SectionHeader } from "@/components/SectionHeader";
import { TonightFilters } from "@/components/TonightFilters";
import { getTonightVegasEvents, getVegasToday } from "@/lib/live-events";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 1800;

export const metadata = {
  title: "Things To Do in Las Vegas Tonight",
  description: "Compare live Las Vegas events scheduled tonight, including shows, comedy, concerts, sports, and attractions.",
  alternates: { canonical: "/tonight" },
};

export default async function TonightPage() {
  const result = await getTonightVegasEvents(getVegasToday(), 50);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://experiencevegas.com";
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Things To Do in Las Vegas Tonight",
    url: `${baseUrl}/tonight`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: result.events.map((event, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: event.name,
        url: event.id.startsWith("ticketmaster-")
          ? `${baseUrl}/events/${event.id.slice("ticketmaster-".length)}`
          : `${baseUrl}/${event.category}/${event.slug}`,
      })),
    },
  };
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <JsonLd data={schema} />
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
