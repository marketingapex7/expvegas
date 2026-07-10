import type { Metadata } from "next";
import { notFound } from "next/navigation";
import topicalMap from "@/data/seo-topical-map.json";
import { seoPillarContent } from "@/data/seo-pillar-content";
import { SeoLandingPage, SeoTopic } from "@/components/SeoLandingPage";

const topics = topicalMap as SeoTopic[];

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = topics.find((item) => item.slug === slug);
  if (!topic) return {};
  const pillarContent = seoPillarContent[topic.slug];
  const description = pillarContent?.directAnswer || `${topic.title} curated around dates, budget, group type, location, and vibe. Build a more useful Vegas game plan with ExperienceVegas.`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://experiencevegas.com";

  return {
    title: `${topic.title} | ExperienceVegas`,
    description,
    robots: { index: Boolean(pillarContent), follow: true },
    alternates: { canonical: `${baseUrl}/${topic.slug}` },
    openGraph: {
      title: `${topic.title} | ExperienceVegas`,
      description,
      url: `${baseUrl}/${topic.slug}`,
      siteName: "ExperienceVegas",
      type: "article",
    },
  };
}

export default async function SeoTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = topics.find((item) => item.slug === slug);
  if (!topic) notFound();
  const relatedTopics = topics.filter((item) => item.cluster === topic.cluster && item.slug !== topic.slug).slice(0, 5);

  return <SeoLandingPage topic={topic} relatedTopics={relatedTopics} />;
}
