import Link from "next/link";

const chips = ["Tonight", "This weekend", "Couples", "Bachelor party", "Under $100", "Near Sphere"];

export function HeroPlanner() {
  return (
    <section className="relative overflow-hidden px-5 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-2 text-sm font-bold text-fuchsia-100">
            Vegas tickets ranked by your dates, budget, group, and vibe.
          </p>
          <h1 className="max-w-5xl text-5xl font-black tracking-tight text-white md:text-7xl">
            Find the Vegas experience actually worth booking.
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-white/70">
            Shows, comedy, sports, concerts, attractions, and last-minute picks. Skip the endless ticket lists and get a smarter Vegas plan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/planner" className="rounded-full bg-white px-6 py-4 text-center font-black text-black transition hover:bg-fuchsia-100">
              Find My Vegas Night
            </Link>
            <Link href="/tonight" className="rounded-full border border-white/15 px-6 py-4 text-center font-black text-white transition hover:bg-white/10">
              Browse Tonight
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">{chip}</span>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/25 backdrop-blur">
          <div className="rounded-[1.5rem] bg-black/30 p-5">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-200">Trip Finder</p>
            <h2 className="mt-3 text-3xl font-black text-white">What kind of Vegas night do you want?</h2>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-white/75">
                When are you going?
                <input className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35" placeholder="Tonight, this weekend, or travel dates" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-white/75">
                Who are you with?
                <select className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none">
                  <option>Couple</option><option>Family</option><option>Friends trip</option><option>Bachelor party</option><option>Bachelorette party</option><option>Solo</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  Budget
                  <select className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none">
                    <option>Under $50</option><option>$50-$100</option><option>$100-$200</option><option>Premium</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-white/75">
                  Vibe
                  <select className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none">
                    <option>Funny</option><option>Romantic</option><option>Wild</option><option>Iconic</option><option>Family-friendly</option><option>Sports</option>
                  </select>
                </label>
              </div>
              <Link href="/planner" className="mt-2 rounded-2xl bg-fuchsia-300 px-5 py-4 text-center font-black text-black transition hover:bg-fuchsia-200">
                Build My Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
