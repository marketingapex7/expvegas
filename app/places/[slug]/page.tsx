import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, MapPin, Sparkles, WalletCards } from "lucide-react";
import { DirectoryCard } from "@/components/DirectoryCard";
import { TripToggleButton } from "@/components/TripToggleButton";
import { directoryListings, getDirectoryListingBySlug } from "@/lib/directory-data";

const categoryLabels = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  attraction: "Attraction",
  free: "Free experience",
  shopping: "Shopping",
  event: "Event",
};

const schemaTypes = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  attraction: "TouristAttraction",
  free: "TouristAttraction",
  shopping: "ShoppingCenter",
  event: "Event",
};

export function generateStaticParams() {
  return directoryListings.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = getDirectoryListingBySlug(slug);
  if (!listing) return {};
  return {
    title: `${listing.name} in Las Vegas`,
    description: listing.description,
    alternates: { canonical: `/places/${slug}` },
    openGraph: { images: [{ url: listing.imageUrl, alt: listing.imageAlt }] },
  };
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = getDirectoryListingBySlug(slug);
  if (!listing) notFound();

  const detailUrl = `/places/${listing.slug}`;
  const tripPick = {
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
  const similar = directoryListings
    .filter((item) => item.category === listing.category && item.id !== listing.id)
    .sort((a, b) => b.editorialScore - a.editorialScore)
    .slice(0, 3);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://experiencevegas.com";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": schemaTypes[listing.category],
    name: listing.name,
    description: listing.description,
    image: listing.imageUrl,
    url: `${siteUrl}${detailUrl}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Las Vegas",
      addressRegion: "NV",
      addressCountry: "US",
    },
    priceRange: listing.priceLabel,
  };

  return (
    <section className="bg-[#f7f7f8] px-4 py-8 text-zinc-950 sm:px-5 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-zinc-500 transition hover:text-zinc-950">
          <ArrowLeft className="h-4 w-4" /> Back to explore
        </Link>

        <div className="relative mt-6 aspect-[16/7] min-h-72 overflow-hidden rounded-lg bg-zinc-200">
          <Image src={listing.imageUrl} alt={listing.imageAlt} fill priority className="object-cover" sizes="(min-width: 1280px) 1200px, calc(100vw - 2rem)" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute bottom-0 left-0 max-w-4xl p-6 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">{categoryLabels[listing.category]} · ExperienceVegas pick</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-6xl">{listing.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/80">
              <MapPin className="h-4 w-4" /> {listing.area}{listing.venue ? ` · ${listing.venue}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article>
            <p className="max-w-3xl text-xl leading-9 text-zinc-700">{listing.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border-t border-zinc-300 py-4">
                <WalletCards className="h-5 w-5 text-fuchsia-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Price guidance</p>
                <p className="mt-1 font-black text-zinc-950">{listing.priceLabel}</p>
              </div>
              <div className="border-t border-zinc-300 py-4">
                <Clock className="h-5 w-5 text-fuchsia-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Planning time</p>
                <p className="mt-1 font-black text-zinc-950">{listing.durationLabel || "Flexible"}</p>
              </div>
              <div className="border-t border-zinc-300 py-4">
                <Sparkles className="h-5 w-5 text-fuchsia-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Editorial score</p>
                <p className="mt-1 font-black text-zinc-950">{listing.editorialScore}/100</p>
              </div>
            </div>

            <div className="mt-8 grid gap-7 border-y border-zinc-200 py-8 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-black text-zinc-950">Best for</h2>
                <ul className="mt-4 space-y-2 text-zinc-600">{listing.bestFor.map((item) => <li key={item}>- {item}</li>)}</ul>
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-950">Highlights</h2>
                <div className="mt-4 flex flex-wrap gap-2">{listing.highlights.map((tag) => <span key={tag} className="rounded-full bg-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700">{tag}</span>)}</div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700">How to fit it into the trip</p>
              <p className="mt-2 leading-7 text-zinc-700">{listing.planningTip}</p>
            </div>
            <p className="mt-5 text-xs font-bold text-zinc-500">Information last checked {listing.lastVerified}. Prices are planning estimates until a live booking partner confirms availability and total cost.</p>
          </article>

          <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-700">Use this in your plan</p>
            <h2 className="mt-2 text-2xl font-black text-zinc-950">Interested in {listing.name}?</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">Add it to your itinerary. Your dates, location, timing, and other saved picks will decide where it fits.</p>
            <div className="mt-5 grid gap-3">
              <TripToggleButton item={tripPick} theme="light" />
              <a href={listing.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-100">
                Open Map <MapPin className="h-4 w-4" />
              </a>
              {listing.bookingUrl ? (
                <a href={listing.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-100">
                  {listing.bookingLabel || "Visit Provider"} <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-500">Provider pages open in a new tab. Confirm current hours, prices, and availability before going.</p>
          </aside>
        </div>

        {similar.length ? (
          <section className="mt-14 border-t border-zinc-200 pt-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700">Compare more ideas</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-950">Similar picks</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">{similar.map((item) => <DirectoryCard key={item.id} listing={item} />)}</div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
