import Link from "next/link";
import { ReactNode } from "react";

export function TrustPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <section className="px-4 py-12 sm:px-5 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-black text-amber-100 transition hover:text-white">ExperienceVegas</Link>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Visitor information</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{intro}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/40">Last updated July 10, 2026</p>
        <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 text-base leading-8 text-white/68 [&_a]:font-bold [&_a]:text-amber-100 [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-white [&_p+p]:mt-3 [&_ul]:grid [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:list-disc">
          {children}
        </div>
      </div>
    </section>
  );
}
