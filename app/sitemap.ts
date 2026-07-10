import type { MetadataRoute } from "next";
import topicalMap from "@/data/seo-topical-map.json";
import { seoPillarContent } from "@/data/seo-pillar-content";

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
  return [
    ...staticPaths.map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...indexableTopics.map((topic) => ({ url: `${baseUrl}/${topic.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
