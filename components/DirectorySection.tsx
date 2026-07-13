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
}: {
  eyebrow: string;
  title: string;
  description: string;
  listings: DirectoryListing[];
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <section className="border-t border-white/10 px-4 py-10 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-100">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">{title}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/62">{description}</p>
          </div>
          <Link href={viewAllHref} className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-white/15 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10 md:self-auto">
            {viewAllLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => <DirectoryCard key={listing.id} listing={listing} />)}
        </div>
      </div>
    </section>
  );
}
