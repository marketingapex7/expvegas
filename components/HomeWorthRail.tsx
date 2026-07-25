import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { TripToggleButton } from "@/components/TripToggleButton";
import { DirectoryListing, TripPick } from "@/types/directory";

const labels = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  attraction: "Attraction",
  free: "Free",
  shopping: "Shopping",
  event: "Event",
};

function costLabel(listing: DirectoryListing) {
  if (listing.costUnit === "free") return "Free";
  const range = listing.estimatedCostMin === listing.estimatedCostMax
    ? `$${listing.estimatedCostMin}`
    : `$${listing.estimatedCostMin}-$${listing.estimatedCostMax}`;
  if (listing.costUnit === "per-night") return `${range} / night`;
  if (listing.costUnit === "per-person") return `${range} / person`;
  return range;
}

function tripPick(listing: DirectoryListing): TripPick {
  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    category: listing.category,
    area: listing.area,
    description: listing.description,
    imageUrl: listing.imageUrl,
    priceLabel: listing.priceLabel,
    durationLabel: listing.durationLabel,
    zone: listing.zone,
    estimatedCostMin: listing.estimatedCostMin,
    estimatedCostMax: listing.estimatedCostMax,
    costUnit: listing.costUnit,
    bookingGuidance: listing.bookingGuidance,
    mapUrl: listing.mapUrl,
    detailUrl: `/places/${listing.slug}`,
  };
}

export function HomeWorthRail({ listings }: { listings: DirectoryListing[] }) {
  if (listings.length < 6) return null;

  return (
    <section className="border-t border-zinc-200 bg-[#f7f7f8] px-4 py-10 text-zinc-950 sm:px-5 sm:py-14" data-testid="home-worth-rail">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700">Useful building blocks</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-950 sm:text-4xl">Worth adding to almost any trip.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-zinc-600">A small mixed shortlist of stays, meals, and flexible stops. Save only what earns a place in your plan.</p>
          </div>
          <Link href="/things-to-do-las-vegas" className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-zinc-900 transition hover:bg-zinc-100">
            Browse everything <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-7 grid auto-cols-[88%] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
          {listings.slice(0, 6).map((listing) => (
            <article key={listing.id} className="flex min-h-64 flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_8px_25px_rgba(24,24,27,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-fuchsia-50 px-3 py-1.5 text-xs font-black text-fuchsia-900">{labels[listing.category]}</span>
                <span className="text-xs font-black text-emerald-800">{costLabel(listing)}</span>
              </div>
              <Link href={`/places/${listing.slug}`} className="mt-4 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600">
                <h3 className="text-2xl font-black leading-tight text-zinc-950 hover:text-fuchsia-800">{listing.name}</h3>
              </Link>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-zinc-500"><MapPin className="h-3.5 w-3.5 text-fuchsia-700" /> {listing.area}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">{listing.description}</p>
              <div className="mt-auto grid gap-2 pt-5">
                <TripToggleButton item={tripPick(listing)} theme="light" />
                <Link href={`/places/${listing.slug}`} className="inline-flex min-h-10 items-center justify-center gap-2 text-sm font-black text-zinc-600 hover:text-fuchsia-800">
                  View details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
