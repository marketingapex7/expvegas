import type { Metadata } from "next";
import { ArrowUpRight, Check, Ticket } from "lucide-react";
import { BrowseResults } from "@/components/BrowseResults";
import { JsonLd } from "@/components/JsonLd";
import { goCityListings } from "@/lib/directory-data";
import { goCityAffiliateLinks } from "@/lib/go-city";

export const metadata: Metadata = {
  title: "Go City Las Vegas Passes and Included Attractions",
  description: "Compare Go City Las Vegas passes and browse the attractions, tours, museums, rides, and selected shows currently included.",
  alternates: { canonical: "/go-city-las-vegas" },
};

const passes = [
  {
    name: "Essentials Pass",
    description: "A smaller choice-based pass for visitors who want a few major attractions without filling the whole trip.",
    price: "From $79 per adult",
    href: goCityAffiliateLinks.essentials,
  },
  {
    name: "Explorer Pass",
    description: "Choose a set number of attractions and use the pass over a longer window. Strongest fit for a selective itinerary.",
    price: "From $99 per adult",
    href: goCityAffiliateLinks.explorer,
  },
  {
    name: "All-Inclusive Pass",
    description: "Choose the number of sightseeing days and visit eligible attractions during that period. Best for attraction-heavy trips.",
    price: "From $169 per adult",
    href: goCityAffiliateLinks["all-inclusive"],
  },
];

export default function GoCityLasVegasPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://experiencevegas.com";
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Go City Las Vegas passes and included attractions",
    url: `${baseUrl}/go-city-las-vegas`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: goCityListings.map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: listing.name,
        url: `${baseUrl}/places/${listing.slug}`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={collectionSchema} />
      <section className="border-b border-white/10 bg-zinc-950 px-4 py-12 text-white sm:px-5 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">Sightseeing passes</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">Compare Go City Las Vegas without losing sight of the itinerary.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/68">Browse all currently tracked inclusions, save the attractions that fit, and let the planner group them around your dates and location. Pass inclusions, reservations, and prices can change, so confirm the final details with Go City.</p>
          <a href={goCityAffiliateLinks.overview} target="_blank" rel="noopener noreferrer sponsored" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-amber-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-200">
            Compare all Go City passes <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="bg-white px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {passes.map((pass) => (
              <article key={pass.name} className="flex min-h-full flex-col rounded-lg border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
                <Ticket className="h-5 w-5 text-fuchsia-700" />
                <h2 className="mt-4 text-2xl font-black">{pass.name}</h2>
                <p className="mt-2 text-sm font-black text-emerald-800">{pass.price}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{pass.description}</p>
                <a href={pass.href} target="_blank" rel="noopener noreferrer sponsored" className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white transition hover:bg-fuchsia-900">
                  View pass <ArrowUpRight className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <Check className="mt-1 h-4 w-4 shrink-0" />
            <p>Some attractions require reservations or operate at fixed times. Adding an item to your itinerary does not reserve it, and displayed retail values are comparison estimates rather than a checkout quote.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-[#f7f7f8] px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-700">Current catalog</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">{goCityListings.length} included Vegas attractions and offers</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">Filter by location, cost, setting, or booking needs. Each selection can be saved to My Itinerary before building the timed plan.</p>
          <div className="mt-8">
            <BrowseResults directory={goCityListings} events={[]} title="Go City Las Vegas attractions" />
          </div>
        </div>
      </section>
    </>
  );
}
