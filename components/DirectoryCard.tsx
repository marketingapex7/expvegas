import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { TripToggleButton } from "@/components/TripToggleButton";
import { DirectoryListing, TripPick } from "@/types/directory";

const categoryDetails = {
  hotel: { label: "Hotel", accent: "bg-sky-100 text-sky-900" },
  restaurant: { label: "Restaurant", accent: "bg-rose-100 text-rose-900" },
  attraction: { label: "Attraction", accent: "bg-fuchsia-100 text-fuchsia-900" },
  free: { label: "Free experience", accent: "bg-emerald-100 text-emerald-900" },
  shopping: { label: "Shopping", accent: "bg-amber-100 text-amber-950" },
  event: { label: "Event", accent: "bg-violet-100 text-violet-900" },
};

export function DirectoryCard({ listing }: { listing: DirectoryListing }) {
  const detailUrl = `/places/${listing.slug}`;
  const details = categoryDetails[listing.category];
  const tripPick: TripPick = {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    category: listing.category,
    area: listing.area,
    description: listing.description,
    imageUrl: listing.imageUrl,
    priceLabel: listing.priceLabel,
    durationLabel: listing.durationLabel,
    estimatedCostMin: listing.estimatedCostMin,
    estimatedCostMax: listing.estimatedCostMax,
    costUnit: listing.costUnit,
    bookingGuidance: listing.bookingGuidance,
    mapUrl: listing.mapUrl,
    detailUrl,
  };

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-lg border border-zinc-200/90 bg-white p-2 shadow-[0_8px_30px_rgba(24,24,27,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(24,24,27,0.14)]">
      <Link href={detailUrl} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-zinc-100">
          <CardImage
            src={listing.imageUrl}
            alt={listing.imageAlt}
            category={listing.category}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur ${details.accent}`}>{details.label}</span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
        <Link href={detailUrl} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600">
          <h3 className="text-2xl font-black leading-[1.08] text-zinc-950 transition group-hover:text-fuchsia-800">{listing.name}</h3>
        </Link>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-700">
          <span className="rounded-full bg-zinc-100 px-3 py-1.5">{listing.area}</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1.5">{listing.priceLabel}</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1.5">{listing.durationLabel}</span>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-700">{listing.description}</p>
        <div className="mt-auto grid gap-2 pt-6">
          <Link href={detailUrl} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 px-4 py-3 text-sm font-black text-zinc-950 shadow-sm transition hover:from-amber-200 hover:to-amber-300">
            View Details <ArrowRight className="h-4 w-4" />
          </Link>
          <TripToggleButton item={tripPick} theme="light" variant="bare" />
        </div>
      </div>
    </article>
  );
}
