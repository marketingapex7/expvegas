import Link from "next/link";
import { ArrowRight, Building2, Drama, Home, Sparkles, Utensils } from "lucide-react";

const destinations = [
  { href: "/las-vegas-hotels", label: "Hotels", Icon: Building2 },
  { href: "/las-vegas-shows", label: "Shows & events", Icon: Drama },
  { href: "/las-vegas-restaurants", label: "Restaurants", Icon: Utensils },
  { href: "/things-to-do-las-vegas", label: "Things to do", Icon: Sparkles },
  { href: "/", label: "Homepage", Icon: Home },
];

export default function NotFound() {
  return (
    <main className="px-4 py-16 text-white sm:px-5 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-200">That route missed the Strip</p>
        <h1 className="mt-4 text-5xl font-black sm:text-7xl">Let&apos;s get your Vegas plan back on track.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75">The page may have moved, but the useful parts of ExperienceVegas are right here.</p>
        <div className="mt-9 grid gap-3 sm:grid-cols-5">
          {destinations.map(({ href, label, Icon }) => <Link key={href} href={href} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] p-3 font-black text-white transition hover:border-amber-200/40 hover:bg-white/10"><Icon className="h-5 w-5 text-amber-200" />{label}</Link>)}
        </div>
        <Link href="/planner" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-fuchsia-300 px-6 py-3 font-black text-zinc-950">Build My Experience <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </main>
  );
}
