import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DirectoryCard } from "@/components/DirectoryCard";
import { DirectoryListing } from "@/types/directory";

export function DirectorySection({
  eyebrow,
  title,
  description,
  listings,
  viewAllHref,
  viewAllLabel,
  mobilePreviewCount,
  compactOnMobile = false,
  testId,
}: {
  eyebrow: string;
  title: string;
  description: string;
  listings: DirectoryListing[];
  viewAllHref: string;
  viewAllLabel: string;
  mobilePreviewCount?: number;
  compactOnMobile?: boolean;
  testId?: string;
}) {
  return (
    <section data-testid={testId} className="border-t border-zinc-200 bg-[#f7f7f8] px-4 py-10 text-zinc-950 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:mb-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-700">{eyebrow}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">{title}</h2>
            <p className={`mt-3 max-w-2xl text-base leading-7 text-zinc-600 ${compactOnMobile ? "hidden sm:block" : ""}`}>{description}</p>
          </div>
          <Link href={viewAllHref} className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-zinc-900 transition hover:bg-zinc-100 md:self-auto">
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              className={`min-w-0 ${mobilePreviewCount !== undefined && index >= mobilePreviewCount ? "hidden sm:block" : ""}`}
            >
              <DirectoryCard listing={listing} />
            </div>
          ))}
        </div>
        {mobilePreviewCount !== undefined && listings.length > mobilePreviewCount ? (
          <Link href={viewAllHref} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-zinc-900 transition hover:bg-zinc-100 sm:hidden">
            See all {listings.length}+ choices <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
