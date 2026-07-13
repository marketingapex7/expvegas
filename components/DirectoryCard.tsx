import Link from "next/link";
import { ArrowRight, Building2, MapPin, ShoppingBag, Sparkles, Utensils } from "lucide-react";
import { TripToggleButton } from "@/components/TripToggleButton";
import { DirectoryListing, TripPick } from "@/types/directory";

const categoryDetails = {
  hotel: { label: "Hotel", Icon: Building2, accent: "bg-sky-300 text-sky-950" },
  restaurant: { label: "Restaurant", Icon: Utensils, accent: "bg-rose-300 text-rose-950" },
  attraction: { label: "Attraction", Icon: Sparkles, accent: "bg-fuchsia-300 text-fuchsia-950" },
  free: { label: "Free experience", Icon: Sparkles, accent: "bg-emerald-300 text-emerald-950" },
  shopping: { label: "Shopping", Icon: ShoppingBag, accent: "bg-amber-200 text-amber-950" },
  event: { label: "Event", Icon: Sparkles, accent: "bg-violet-300 text-violet-950" },
};

export function DirectoryCard({ listing }: { listing: DirectoryListing }) {
  const detailUrl = `/places/${listing.slug}`;
  const details = categoryDetails[listing.category];
  const Icon = details.Icon;
  const tripPick: TripPick = {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    category: listing.category,
    area: listing.area,
    description: listing.description,
    detailUrl,
  };

  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.075]">
      <Link href={detailUrl} className="block border-b border-white/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${details.accent}`}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-black text-white/65">{listing.priceLabel}</span>
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-white/45">{details.label}</p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-white">{listing.name}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-white/55"><MapPin className="h-4 w-4" /> {listing.area}</p>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-3 text-sm leading-6 text-white/68">{listing.description}</p>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-amber-100">Best for</p>
        <p className="mt-1 text-sm leading-6 text-white/60">{listing.bestFor.slice(0, 3).join(" / ")}</p>
        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
          <Link href={detailUrl} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-black text-white transition hover:bg-white/10">
            Details <ArrowRight className="h-4 w-4" />
          </Link>
          <TripToggleButton item={tripPick} compact />
        </div>
      </div>
    </article>
  );
}
