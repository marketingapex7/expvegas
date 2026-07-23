import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  Route,
  Sparkles,
  WalletCards,
  XCircle,
} from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { DirectoryCard } from "@/components/DirectoryCard";
import { TripToggleButton } from "@/components/TripToggleButton";
import { directoryListings, getDirectoryListingBySlug } from "@/lib/directory-data";
import { DirectoryListing } from "@/types/directory";

const categoryLabels = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  attraction: "Attraction",
  free: "Free experience",
  shopping: "Shopping",
  event: "Event",
};

const categoryLinks = {
  hotel: { href: "/las-vegas-hotels", label: "Las Vegas hotels" },
  restaurant: { href: "/las-vegas-restaurants", label: "Las Vegas restaurants" },
  attraction: { href: "/las-vegas-attractions", label: "Las Vegas attractions" },
  free: { href: "/free-things-to-do-las-vegas", label: "free things to do" },
  shopping: { href: "/las-vegas-shopping", label: "Las Vegas shopping" },
  event: { href: "/tonight", label: "Las Vegas events" },
};

const schemaTypes = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  attraction: "TouristAttraction",
  free: "TouristAttraction",
  shopping: "ShoppingCenter",
  event: "Event",
};

const relatedGuidesByCategory = {
  hotel: [
    { href: "/best-hotels-on-the-las-vegas-strip", label: "Best Hotels on the Las Vegas Strip" },
    { href: "/downtown-las-vegas-hotels", label: "Downtown Las Vegas Hotels" },
    { href: "/las-vegas-first-time-visitors", label: "Vegas for First-Time Visitors" },
  ],
  restaurant: [
    { href: "/las-vegas-steakhouses", label: "Las Vegas Steakhouses" },
    { href: "/las-vegas-buffets", label: "Las Vegas Buffets" },
    { href: "/cheap-eats-las-vegas", label: "Cheap Eats in Las Vegas" },
  ],
  attraction: [
    { href: "/things-to-do-las-vegas", label: "Things To Do in Las Vegas" },
    { href: "/las-vegas-family-activities", label: "Family Things To Do" },
    { href: "/free-things-to-do-las-vegas", label: "Free Things To Do" },
  ],
  free: [
    { href: "/free-things-to-do-las-vegas", label: "Free Things To Do in Las Vegas" },
    { href: "/cheap-things-to-do", label: "Cheap Things To Do" },
    { href: "/las-vegas-first-time-visitors", label: "Vegas for First-Time Visitors" },
  ],
  shopping: [
    { href: "/las-vegas-shopping", label: "Shopping in Las Vegas" },
    { href: "/things-to-do-las-vegas", label: "Things To Do in Las Vegas" },
    { href: "/las-vegas-for-families", label: "Las Vegas for Families" },
  ],
  event: [
    { href: "/las-vegas-shows", label: "Las Vegas Shows" },
    { href: "/tonight", label: "What Is On Tonight" },
    { href: "/this-weekend", label: "Vegas This Weekend" },
  ],
};

const relatedGuidesByZone = {
  "South Strip": [
    { href: "/near/t-mobile-arena", label: "Things To Do Near T-Mobile Arena" },
    { href: "/near/allegiant-stadium", label: "Things To Do Near Allegiant Stadium" },
    { href: "/near/mgm-grand", label: "Things To Do Near MGM Grand" },
  ],
  "Center Strip": [
    { href: "/near/bellagio", label: "Things To Do Near Bellagio" },
    { href: "/near/caesars-palace", label: "Things To Do Near Caesars Palace" },
  ],
  "North Strip": [
    { href: "/near/sphere", label: "Things To Do Near Sphere" },
    { href: "/restaurants-near-sphere-las-vegas", label: "Restaurants Near Sphere" },
  ],
  Downtown: [
    { href: "/downtown-las-vegas-hotels", label: "Downtown Las Vegas Hotels" },
    { href: "/free-things-to-do-las-vegas", label: "Free Things To Do" },
  ],
  "Off Strip": [
    { href: "/cheap-eats-las-vegas", label: "Cheap Eats in Las Vegas" },
    { href: "/las-vegas-day-trips", label: "Day Trips From Las Vegas" },
  ],
};

function estimatedCostLabel(listing: DirectoryListing) {
  if (listing.costUnit === "free" || (listing.estimatedCostMin === 0 && listing.estimatedCostMax === 0)) return "Free";
  const range = listing.estimatedCostMin === listing.estimatedCostMax
    ? `$${listing.estimatedCostMin}`
    : `$${listing.estimatedCostMin}-$${listing.estimatedCostMax}`;
  const unit = listing.costUnit === "per-night" ? "per night" : listing.costUnit === "per-person" ? "per person" : "";
  return `${range} ${unit}`.trim();
}

function durationLabel(listing: DirectoryListing) {
  if (listing.category === "hotel") return "Your trip base";
  if (listing.durationMinMinutes === listing.durationMaxMinutes) return `${listing.durationMinMinutes} minutes`;
  return `${listing.durationMinMinutes}-${listing.durationMaxMinutes} minutes`;
}

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
    zone: listing.zone,
    estimatedCostMin: listing.estimatedCostMin,
    estimatedCostMax: listing.estimatedCostMax,
    costUnit: listing.costUnit,
    bookingGuidance: listing.bookingGuidance,
    mapUrl: listing.mapUrl,
    detailUrl,
  };
  const nearby = directoryListings
    .filter((item) => item.id !== listing.id && item.zone === listing.zone)
    .sort((a, b) => {
      const exactAreaDifference = Number(b.area === listing.area) - Number(a.area === listing.area);
      if (exactAreaDifference) return exactAreaDifference;
      const categoryDifference = Number(b.category !== listing.category) - Number(a.category !== listing.category);
      if (categoryDifference) return categoryDifference;
      return b.editorialScore - a.editorialScore;
    })
    .slice(0, 4);
  const categoryLink = categoryLinks[listing.category];
  const relatedGuides = [...relatedGuidesByZone[listing.zone], ...relatedGuidesByCategory[listing.category]]
    .filter((guide, index, guides) => guides.findIndex((item) => item.href === guide.href) === index)
    .slice(0, 4);
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
    touristType: listing.bestFor,
  };
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: categoryLink.label, item: `${siteUrl}${categoryLink.href}` },
      { "@type": "ListItem", position: 3, name: listing.name, item: `${siteUrl}${detailUrl}` },
    ],
  };

  return (
    <section className="bg-[#f7f7f8] px-4 py-8 text-zinc-950 sm:px-5 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-7xl">
        <Link href={categoryLink.href} className="inline-flex items-center gap-2 text-sm font-black text-zinc-500 transition hover:text-zinc-950">
          <ArrowLeft className="h-4 w-4" /> Back to {categoryLink.label}
        </Link>

        <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-lg bg-zinc-200 sm:aspect-[16/7] sm:min-h-72">
          <CardImage
            src={listing.imageUrl}
            alt={listing.imageAlt}
            category={listing.category}
            priority
            className="object-cover"
            sizes="(min-width: 1280px) 1200px, calc(100vw - 2rem)"
            fallbackLabel={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute bottom-0 left-0 max-w-4xl p-6 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">{categoryLabels[listing.category]} | ExperienceVegas pick</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-6xl">{listing.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/80">
              <MapPin className="h-4 w-4" /> {listing.area}{listing.venue ? ` | ${listing.venue}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article>
            <p className="max-w-3xl text-xl leading-9 text-zinc-700">{listing.description}</p>

            <div className="mt-8 grid gap-x-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="border-t border-zinc-300 py-4">
                <WalletCards className="h-5 w-5 text-fuchsia-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Estimated cost</p>
                <p className="mt-1 font-black text-zinc-950">{estimatedCostLabel(listing)}</p>
              </div>
              <div className="border-t border-zinc-300 py-4">
                <Clock className="h-5 w-5 text-fuchsia-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Allow</p>
                <p className="mt-1 font-black text-zinc-950">{durationLabel(listing)}</p>
              </div>
              <div className="border-t border-zinc-300 py-4">
                <CalendarClock className="h-5 w-5 text-fuchsia-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Best timing</p>
                <p className="mt-1 font-black text-zinc-950">{listing.idealTime}</p>
              </div>
              <div className="border-t border-zinc-300 py-4">
                <Sparkles className="h-5 w-5 text-fuchsia-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Environment</p>
                <p className="mt-1 font-black text-zinc-950">{listing.environment}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-7 border-y border-zinc-200 py-8 md:grid-cols-2">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-black text-zinc-950"><CheckCircle2 className="h-5 w-5 text-emerald-700" /> Good fit when</h2>
                <ul className="mt-4 space-y-2 text-zinc-600">{listing.bestFor.map((item) => <li key={item}>- {item}</li>)}</ul>
              </div>
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-black text-zinc-950"><XCircle className="h-5 w-5 text-rose-700" /> Skip it when</h2>
                <ul className="mt-4 space-y-2 text-zinc-600">{listing.skipIf.map((item) => <li key={item}>- {item}</li>)}</ul>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="border-l-4 border-fuchsia-600 bg-fuchsia-50 p-5">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700"><Route className="h-4 w-4" /> How to fit it into the trip</p>
                <p className="mt-3 leading-7 text-zinc-700">{listing.planningTip}</p>
              </div>
              <div className="border-l-4 border-amber-500 bg-amber-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Booking approach</p>
                <p className="mt-3 leading-7 text-zinc-700">{listing.bookingAdvice}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-black text-zinc-950">What stands out</h2>
              <div className="mt-4 flex flex-wrap gap-2">{listing.highlights.map((tag) => <span key={tag} className="rounded-full bg-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700">{tag}</span>)}</div>
            </div>
            <p className="mt-6 text-xs font-bold text-zinc-500">Information last checked {listing.lastVerified}. Prices are editorial planning estimates until a provider confirms current availability and total cost.</p>
          </article>

          <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-700">Use this in your plan</p>
            <h2 className="mt-2 text-2xl font-black text-zinc-950">Interested in {listing.name}?</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">Add it to your itinerary as a {listing.planningRole.toLowerCase()}. Your dates and other saved picks will decide where it fits.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-3 py-2">{listing.zone}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-2">{listing.environment}</span>
            </div>
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

        {nearby.length ? (
          <section className="mt-14 border-t border-zinc-200 pt-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700">Build around this area</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-950">More useful picks in {listing.zone}.</h2>
            <p className="mt-3 max-w-3xl leading-7 text-zinc-600">These are in the same broad Vegas zone. Confirm the exact walking or driving route before placing fixed reservations back to back.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{nearby.map((item) => <DirectoryCard key={item.id} listing={item} />)}</div>
          </section>
        ) : null}

        <section className="mt-14 border-t border-zinc-200 pt-10">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700"><BookOpen className="h-4 w-4" /> Keep planning</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Useful guides around this choice.</h2>
          <p className="mt-3 max-w-3xl leading-7 text-zinc-600">Compare the broader category, then use a nearby guide to keep the rest of the day in a realistic part of Vegas.</p>
          <div className="mt-6 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedGuides.map((guide) => (
              <Link key={guide.href} href={guide.href} className="group flex min-h-20 items-center justify-between gap-4 border-t border-zinc-300 py-4 text-sm font-black text-zinc-800 transition hover:border-fuchsia-400 hover:text-fuchsia-800">
                {guide.label} <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
