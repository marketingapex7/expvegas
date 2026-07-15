import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { seedEvents } from "@/data/seed-events";
import { seoPillarContent } from "@/data/seo-pillar-content";
import { BrowseResults } from "@/components/BrowseResults";
import { experienceListings, hotelListings, restaurantListings } from "@/lib/directory-data";
import { rankEvents } from "@/lib/scoring";
import { DirectoryListing } from "@/types/directory";

export type SeoTopic = {
  slug: string;
  title: string;
  pillar: string;
  cluster: string;
  pageType: string;
  intent: string;
  primaryKeyword: string;
  seedKeywords: string[];
};

function clusterDescription(topic: SeoTopic) {
  switch (topic.cluster) {
    case "entertainment":
      return `Compare ${topic.title.toLowerCase()} by dates, venue, price, group fit, and the kind of night you actually want.`;
    case "attractions":
      return `Build a better Vegas day with ${topic.title.toLowerCase()}, flexible stops, and experiences that fit around your main plans.`;
    case "dining":
      return `Find ${topic.title.toLowerCase()} that work with your budget, group, location, and the rest of your Vegas schedule.`;
    case "lodging":
      return `Choose a Vegas base by location, trip style, budget, and what you want to do after you check in.`;
    case "planning":
      return `Turn ${topic.title.toLowerCase()} into a practical game plan with timed events, meals, free stops, and realistic buffers.`;
    default:
      return `Use ExperienceVegas to turn ${topic.title.toLowerCase()} into a more confident Vegas plan.`;
  }
}

function comparePoints(topic: SeoTopic) {
  if (topic.cluster === "entertainment") return ["Real dates and venue fit", "Ticket value and group fit", "What to do before and after"];
  if (topic.cluster === "dining") return ["Cuisine and meal style", "Spend per person", "Location and reservation timing"];
  if (topic.cluster === "lodging") return ["Best area for your itinerary", "Walkability and rideshare friction", "Budget versus Strip convenience"];
  if (topic.cluster === "planning") return ["Trip length and arrival rhythm", "One strong anchor per day", "Food, free stops, and open space"];
  return ["Ticketed versus free options", "Location and time commitment", "What fits your group and vibe"];
}

function eventMatchesTopic(event: (typeof seedEvents)[number], topic: SeoTopic) {
  const text = `${topic.title} ${topic.primaryKeyword}`.toLowerCase();
  if (topic.cluster === "entertainment") {
    if (text.includes("comedy")) return event.category === "comedy";
    if (text.includes("concert") || text.includes("sphere")) return event.category === "concerts";
    if (text.includes("sport")) return event.category === "sports";
    return event.category === "shows";
  }
  if (topic.cluster === "attractions") return event.category === "attractions" || (topic.primaryKeyword.includes("cheap") && (event.priceMin || 999) <= 100);
  return true;
}

function listingsForTopic(topic: SeoTopic): DirectoryListing[] {
  const text = `${topic.slug} ${topic.primaryKeyword}`.toLowerCase();
  let source: DirectoryListing[] = [];

  if (topic.cluster === "lodging") source = hotelListings;
  if (topic.cluster === "dining") source = restaurantListings;
  if (topic.cluster === "attractions" || topic.cluster === "experiences") source = experienceListings;
  if (!source.length) return [];

  const filtered = source.filter((listing) => {
    const listingText = `${listing.name} ${listing.area} ${listing.category} ${listing.tags.join(" ")}`.toLowerCase();
    if (text.includes("downtown")) return listingText.includes("downtown");
    if (text.includes("strip") && topic.cluster === "lodging") return !listingText.includes("downtown");
    if (text.includes("steakhouse")) return listingText.includes("steak");
    if (text.includes("buffet")) return listingText.includes("buffet");
    if (text.includes("cheap eat")) return listing.priceLabel === "$";
    if (text.includes("sphere") && topic.cluster === "dining") return listingText.includes("sphere") || listingText.includes("venetian");
    if (text.includes("free")) return listing.category === "free" || listing.category === "shopping";
    if (text.includes("shopping")) return listing.category === "shopping";
    if (text.includes("family")) return listingText.includes("family");
    return true;
  });

  return (filtered.length ? filtered : source).sort((a, b) => b.editorialScore - a.editorialScore).slice(0, 6);
}

export function SeoLandingPage({ topic, relatedTopics }: { topic: SeoTopic; relatedTopics: SeoTopic[] }) {
  const points = comparePoints(topic);
  const events = rankEvents(seedEvents.filter((event) => eventMatchesTopic(event, topic))).slice(0, 6);
  const directory = listingsForTopic(topic);
  const pillarContent = seoPillarContent[topic.slug];
  const editorialContent = topic.cluster === "planning" ? pillarContent : undefined;
  const faqSchema = editorialContent
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: editorialContent.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : undefined;
  const articleSchema = editorialContent
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: topic.title,
        description: editorialContent.directAnswer,
        dateModified: "2026-07-10",
        author: { "@type": "Organization", name: "ExperienceVegas" },
        publisher: { "@type": "Organization", name: "ExperienceVegas" },
      }
    : undefined;

  return (
    <section className="px-4 py-12 sm:px-5 sm:py-16">
      <div className="mx-auto max-w-7xl">
        {articleSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} /> : null}
        {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} /> : null}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm font-bold text-white/45">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white/70">{topic.title}</span>
        </nav>
        <div className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-100">{topic.pillar} · {topic.pageType}</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-6xl">{topic.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{clusterDescription(topic)}</p>
          {editorialContent ? <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/40">Reviewed {editorialContent.reviewed}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/planner" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-amber-100">
              Build my Experience <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/tonight" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-bold text-white/75 transition hover:bg-white/10">
              Check live picks <CalendarDays className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {editorialContent ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-lg border border-amber-100/20 bg-amber-100/[0.07] p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">The short answer</p>
              <p className="mt-3 text-lg font-bold leading-8 text-white/82">{editorialContent.directAnswer}</p>
            </div>
            <nav aria-label="On this page" className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">On this page</p>
              <div className="mt-3 grid gap-2">
                {editorialContent.sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="flex items-start gap-2 text-sm font-bold leading-6 text-white/65 transition hover:text-white">
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-amber-100" /> {section.heading}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        ) : null}

        {editorialContent ? (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {points.map((point, index) => (
              <div key={point} className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-sm font-black text-black">{index + 1}</span>
                <p className="mt-4 font-black text-white">{point}</p>
              </div>
            ))}
          </div>
        ) : null}

        {editorialContent ? (
          <div className="mt-14 grid gap-10">
            {editorialContent.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 border-t border-white/10 pt-8">
                <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                  <h2 className="text-3xl font-black leading-tight text-white">{section.heading}</h2>
                  <div>
                    <p className="text-base leading-8 text-white/68">{section.body}</p>
                    <ul className="mt-5 grid gap-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 rounded-lg bg-white/[0.05] px-4 py-3 text-sm font-bold leading-6 text-white/72">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-amber-100" /> {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : null}

        <section className={`relative left-1/2 w-screen -translate-x-1/2 border-y border-zinc-200 bg-[#f7f7f8] px-4 py-10 text-zinc-950 sm:px-5 sm:py-14 ${editorialContent ? "mt-12" : "mt-8"}`}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-700">Curated starting points</p>
                <h2 className="mt-2 text-3xl font-black text-zinc-950">Compare {topic.title.toLowerCase()}.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-zinc-600">Save the choices that fit. Your dates, budget, location, and group will decide what belongs in the final itinerary.</p>
            </div>
            <BrowseResults directory={directory} events={directory.length ? [] : events} title={topic.title} />
          </div>
        </section>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-amber-100/20 bg-amber-100/[0.07] p-6">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-amber-100"><Sparkles className="h-4 w-4" /> Make it personal</p>
            <h2 className="mt-3 text-3xl font-black text-white">The best answer depends on your actual trip.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/68">Give us your dates, group, budget, lodging area, food preferences, and vibe. ExperienceVegas will turn this topic into a timed plan with ticketed and non-ticketed stops.</p>
            <Link href="/planner" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-amber-100">Build a timed plan <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-6">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200"><MapPin className="h-4 w-4" /> Explore this cluster</p>
            <div className="mt-4 grid gap-2">
              {relatedTopics.map((related) => <Link key={related.slug} href={`/${related.slug}`} className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-3 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white"><span>{related.title}</span><ArrowRight className="h-4 w-4" /></Link>)}
            </div>
          </div>
        </div>

        {editorialContent ? (
          <section className="mt-14 border-t border-white/10 pt-10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">Frequently asked questions</p>
            <h2 className="mt-3 text-3xl font-black text-white">Planning answers before you book.</h2>
            <div className="mt-6 grid gap-3">
              {editorialContent.faqs.map((faq) => (
                <details key={faq.question} className="group rounded-lg border border-white/10 bg-white/[0.05] p-5">
                  <summary className="cursor-pointer list-none pr-6 font-black text-white marker:hidden">{faq.question}</summary>
                  <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
