"use client";

import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { directoryNav } from "@/data/nav";
import { useTripSelections } from "@/components/TripSelectionProvider";

export function Header() {
  const { items, hydrated } = useTripSelections();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState("");
  const [mobileSection, setMobileSection] = useState("");

  function closeMenus() {
    setMenuOpen(false);
    setDesktopMenu("");
    setMobileSection("");
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setDesktopMenu("");
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDesktopMenu("");
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <Link href="/" onClick={closeMenus} className="shrink-0 text-lg font-black text-white">
          Experience<span className="text-fuchsia-300">Vegas</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {directoryNav.map((item) => {
            const open = desktopMenu === item.label;
            return (
              <div key={item.label} className="relative">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setDesktopMenu(open ? "" : item.label)}
                  className={`inline-flex min-h-10 items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold transition ${open ? "bg-white/10 text-white" : "text-white/68 hover:bg-white/[0.06] hover:text-white"}`}
                >
                  {item.label} <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
                </button>
                {open ? (
                  <div className="absolute left-1/2 top-[calc(100%+0.75rem)] w-[34rem] -translate-x-1/2 rounded-lg border border-white/10 bg-[#100e15] p-5 shadow-2xl shadow-black/60">
                    <div className="grid grid-cols-2 gap-7">
                      {item.columns.map((column) => (
                        <div key={column.label}>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">{column.label}</p>
                          <div className="mt-3 grid gap-1">
                            {column.links.map((link) => (
                              <Link key={link.href} href={link.href} onClick={closeMenus} className="rounded-lg px-3 py-2.5 text-sm font-bold text-white/68 transition hover:bg-white/[0.07] hover:text-white">{link.label}</Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href={item.href} onClick={closeMenus} className="mt-5 flex min-h-11 items-center justify-between rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-white transition hover:bg-white/10">
                      View all {item.label.toLowerCase()} <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/my-trip" onClick={closeMenus} aria-label={`My Itinerary with ${items.length} saved picks`} className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-black text-white transition hover:bg-white/10">
            <CalendarDays className="h-4 w-4" /> <span className="hidden md:inline">My Itinerary</span>
            {hydrated && items.length ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1 text-[11px] font-black text-black">{items.length}</span> : null}
          </Link>
          <Link href="/planner" onClick={closeMenus} className="hidden min-h-10 items-center rounded-lg bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-amber-100 sm:inline-flex">
            Build My Experience
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white transition hover:bg-white/10 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav aria-label="Mobile navigation" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-[#0c0a0f] px-4 py-3 lg:hidden">
          <div className="mx-auto max-w-7xl">
            {directoryNav.map((item) => {
              const open = mobileSection === item.label;
              return (
                <div key={item.label} className="border-b border-white/10">
                  <button type="button" aria-expanded={open} onClick={() => setMobileSection(open ? "" : item.label)} className="flex min-h-12 w-full items-center justify-between py-3 text-left font-black text-white">
                    {item.label} <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open ? (
                    <div className="grid gap-4 pb-4 sm:grid-cols-2">
                      {item.columns.map((column) => (
                        <div key={column.label}>
                          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">{column.label}</p>
                          <div className="grid gap-1">{column.links.map((link) => <Link key={link.href} href={link.href} onClick={closeMenus} className="rounded-lg px-3 py-2.5 text-sm font-bold text-white/68 hover:bg-white/[0.07] hover:text-white">{link.label}</Link>)}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <Link href="/planner" onClick={closeMenus} className="mt-4 flex min-h-12 items-center justify-center rounded-lg bg-white px-4 py-3 font-black text-black transition hover:bg-amber-100 sm:hidden">Build My Experience</Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
