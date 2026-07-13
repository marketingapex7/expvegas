import type { Metadata } from "next";
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
    <section className="px-4 py-10 sm:px-5 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-white/60 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to explore</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-100">{categoryLabels[listing.category]} · ExperienceVegas pick</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-6xl">{listing.name}</h1>
            <p className="mt-4 flex items-center gap-2 text-base font-bold text-white/55"><MapPin className="h-4 w-4 text-fuchsia-200" /> {listing.area}{listing.venue ? ` · ${listing.venue}` : ""}</p>
            <p className="mt-7 max-w-3xl text-xl leading-9 text-white/72">{listing.description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border-t border-white/15 py-4">
                <WalletCards className="h-5 w-5 text-amber-100" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-white/45">Price guidance</p>
                <p className="mt-1 font-black text-white">{listing.priceLabel}</p>
              </div>
              <div className="border-t border-white/15 py-4">
                <Clock className="h-5 w-5 text-amber-100" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-white/45">Planning time</p>
                <p className="mt-1 font-black text-white">{listing.durationLabel || "Flexible"}</p>
              </div>
              <div className="border-t border-white/15 py-4">
                <Sparkles className="h-5 w-5 text-amber-100" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-white/45">Editorial score</p>
                <p className="mt-1 font-black text-white">{listing.editorialScore}/100</p>
              </div>
            </div>

            <div className="mt-8 grid gap-7 border-y border-white/10 py-8 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-black text-white">Best for</h2>
                <ul className="mt-4 space-y-2 text-white/68">{listing.bestFor.map((item) => <li key={item}>- {item}</li>)}</ul>
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Good to know</h2>
                <div className="mt-4 flex flex-wrap gap-2">{listing.tags.slice(0, 8).map((tag) => <span key={tag} className="rounded-full bg-white/[0.07] px-3 py-2 text-xs font-bold text-white/65">{tag}</span>)}</div>
              </div>
            </div>
          </article>

          <aside className="h-fit rounded-lg border border-white/10 bg-white/[0.06] p-5 lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Use this in your plan</p>
            <h2 className="mt-2 text-2xl font-black text-white">Interested in {listing.name}?</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">Add it to your trip tray. The planner will consider your dates, location, timing, and other picks before placing it.</p>
            <div className="mt-5 grid gap-3">
              <TripToggleButton item={tripPick} />
              {listing.bookingUrl ? (
                <a href={listing.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-amber-100">
                  {listing.bookingLabel || "Visit Provider"} <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            <p className="mt-4 text-xs leading-5 text-white/40">Provider pages open in a new tab, so your trip remains here. Confirm current hours, prices, and availability before going.</p>
          </aside>
        </div>

        {similar.length ? (
          <section className="mt-14 border-t border-white/10 pt-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">Compare nearby ideas</p>
            <h2 className="mt-2 text-3xl font-black text-white">Similar picks</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">{similar.map((item) => <DirectoryCard key={item.id} listing={item} />)}</div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
