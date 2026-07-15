import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
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
    <article className="flex min-h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg">
      <Link href={detailUrl} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
          <Image src={listing.imageUrl} alt={listing.imageAlt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 hover:scale-[1.03]" />
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-black shadow-sm ${details.accent}`}>{details.label}</span>
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-zinc-900 shadow-sm">{listing.priceLabel}</span>
        </div>
        <div className="border-b border-zinc-100 p-5 pb-4">
          <h3 className="text-xl font-black leading-tight text-zinc-950">{listing.name}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-zinc-500"><MapPin className="h-4 w-4" /> {listing.area}</p>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-3 text-sm leading-6 text-zinc-600">{listing.description}</p>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-fuchsia-700">Best for</p>
        <p className="mt-1 text-sm leading-6 text-zinc-600">{listing.bestFor.slice(0, 3).join(" / ")}</p>
        <p className="mt-3 text-xs font-bold text-zinc-500">{listing.bookingGuidance === "free" ? "No booking needed" : listing.bookingGuidance === "reserve" ? "Reservation recommended" : listing.bookingGuidance === "check-availability" ? "Check live availability" : "Flexible timing"} · Verified {listing.lastVerified}</p>
        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
          <Link href={detailUrl} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-black text-zinc-900 transition hover:bg-zinc-100">
            Details <ArrowRight className="h-4 w-4" />
          </Link>
          <TripToggleButton item={tripPick} compact theme="light" />
        </div>
      </div>
    </article>
  );
}
