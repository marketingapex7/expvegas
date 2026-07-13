import type { MetadataRoute } from "next";
import topicalMap from "@/data/seo-topical-map.json";
import { seoPillarContent } from "@/data/seo-pillar-content";
import { bestIntentPages, nearIntentPages } from "@/data/intent-pages";
import { seedEvents } from "@/data/seed-events";
import { directoryListings } from "@/lib/directory-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://experiencevegas.com";
  const staticPaths = [
    "",
    "/planner",
    "/tonight",
    "/this-weekend",
    "/cheap-things-to-do",
    "/privacy",
    "/terms",
    "/affiliate-disclosure",
    "/contact",
    "/responsible-gaming",
  ];
  const indexableTopics = topicalMap.filter((topic) => Boolean(seoPillarContent[topic.slug]));
  const intentPaths = [
    ...Object.keys(bestIntentPages).map((slug) => `/best/${slug}`),
    ...Object.keys(nearIntentPages).map((slug) => `/near/${slug}`),
  ];
  const eventPaths = seedEvents.map((event) => `/${event.category}/${event.slug}`);
  const directoryPaths = directoryListings.map((listing) => `/places/${listing.slug}`);
  return [
    ...staticPaths.map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...indexableTopics.map((topic) => ({ url: `${baseUrl}/${topic.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...intentPaths.map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...eventPaths.map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...directoryPaths.map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
