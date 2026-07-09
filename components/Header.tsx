"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { primaryNav } from "@/data/nav";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
        <Link href="/" className="text-lg font-black tracking-tight text-white" onClick={() => setMenuOpen(false)}>
          Experience<span className="text-fuchsia-300">Vegas</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/75 md:flex">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/planner" className="hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-fuchsia-100 sm:inline-flex">
            Build my Experience
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav className="border-t border-white/10 bg-black/90 px-4 py-3 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link href="/planner" onClick={() => setMenuOpen(false)} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-fuchsia-100">
              Build my Experience
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
