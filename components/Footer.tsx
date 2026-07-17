import Link from "next/link";

const exploreLinks = [
  ["Things to do", "/things-to-do-las-vegas"],
  ["Shows", "/las-vegas-shows"],
  ["Restaurants", "/las-vegas-restaurants"],
  ["Hotels", "/las-vegas-hotels"],
  ["First-time guide", "/las-vegas-first-time-visitors"],
];

const trustLinks = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Affiliate disclosure", "/affiliate-disclosure"],
  ["Contact", "/contact"],
  ["Responsible gaming", "/responsible-gaming"],
];

export function Footer() {
  return (
    <footer className="border-t border-fuchsia-300/15 bg-gradient-to-b from-[#100b18] to-black px-5 pb-28 pt-10 text-sm text-white/70 md:pb-10">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-lg font-black text-white">Experience<span className="text-fuchsia-300">Vegas</span></Link>
          <p className="mt-3 max-w-xs leading-6">Trip-aware Vegas recommendations for real dates, budgets, groups, locations, and vibes.</p>
        </div>
        <div>
          <p className="font-black text-white">Plan</p>
          <div className="mt-3 grid gap-2">
            <Link href="/planner" className="hover:text-white">Build an experience</Link>
            <Link href="/tonight" className="hover:text-white">Tonight</Link>
            <Link href="/this-weekend" className="hover:text-white">This weekend</Link>
          </div>
        </div>
        <div>
          <p className="font-black text-white">Explore</p>
          <div className="mt-3 grid gap-2">
            {exploreLinks.map(([label, href]) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}
          </div>
        </div>
        <div>
          <p className="font-black text-white">Trust</p>
          <div className="mt-3 grid gap-2">
            {trustLinks.map(([label, href]) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-5 text-xs leading-5 text-white/40">
        &copy; {new Date().getFullYear()} ExperienceVegas.com. Availability, schedules, and prices can change; confirm details with the provider before booking.
      </div>
    </footer>
  );
}
