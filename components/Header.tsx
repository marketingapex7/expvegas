import Link from "next/link";
import { primaryNav } from "@/data/nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-lg font-black tracking-tight text-white">
          Experience<span className="text-fuchsia-300">Vegas</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/75 md:flex">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/planner" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-fuchsia-100">
          Find My Night
        </Link>
      </div>
    </header>
  );
}
