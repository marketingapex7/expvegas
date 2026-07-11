import type { Metadata } from "next";
import { VegasEvent } from "@/types/event";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://experiencevegas.com";

function descriptionFor(event: VegasEvent) {
  return `${event.quickVerdict} Compare venue, timing, price guidance, and who it is best for.`;
}

export function buildEventMetadata(event: VegasEvent, path: string): Metadata {
  const description = descriptionFor(event);
  return {
    title: `${event.name} in Las Vegas`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title: `${event.name} in Las Vegas`,
      description,
      siteName: "ExperienceVegas",
    },
    twitter: {
      card: "summary",
      title: `${event.name} in Las Vegas`,
      description,
    },
  };
}

export function buildEventStructuredData(event: VegasEvent, path: string) {
  const startDate = event.startDateTime || (event.localDate ? `${event.localDate}T${event.localTime || "00:00:00"}` : undefined);
  if (!startDate) return null;

  const ticketUrl = event.affiliateUrl && event.affiliateUrl !== "#" ? event.affiliateUrl : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: descriptionFor(event),
    startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${siteUrl}${path}`,
    location: {
      "@type": "Place",
      name: event.venueName,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venueAddress?.streetAddress,
        addressLocality: event.venueAddress?.addressLocality || "Las Vegas",
        addressRegion: event.venueAddress?.addressRegion || "NV",
        postalCode: event.venueAddress?.postalCode,
        addressCountry: event.venueAddress?.addressCountry || "US",
      },
    },
    ...(ticketUrl && event.priceMin !== undefined
      ? {
          offers: {
            "@type": "Offer",
            url: ticketUrl,
            price: event.priceMin,
            priceCurrency: event.currency || "USD",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}
