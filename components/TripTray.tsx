"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, ChevronRight, MapPin, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTripSelections } from "@/components/TripSelectionProvider";

const categoryLabels = {
  hotel: "Stay",
  restaurant: "Eat",
  event: "Event",
  attraction: "Do",
  free: "Free",
  shopping: "Explore",
};

export function TripTray() {
  const { items, hydrated, removeItem, clearItems } = useTripSelections();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!hydrated || pathname === "/my-trip" || pathname === "/itinerary") return;
    let animationFrame = 0;
    function handleScroll() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        setScrolled(window.scrollY > 80);
      });
    }
    function handleMobileMenu(event: Event) { setMobileMenuOpen(Boolean((event as CustomEvent<{ open: boolean }>).detail?.open)); }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("experiencevegas:mobile-menu", handleMobileMenu);
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("experiencevegas:mobile-menu", handleMobileMenu);
    };
  }, [hydrated, pathname]);

  if (!hydrated || mobileMenuOpen || pathname === "/my-trip" || pathname === "/itinerary") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group fixed bottom-4 right-4 z-40 flex h-12 w-12 min-h-12 items-center justify-between overflow-hidden rounded-full border border-amber-100/30 bg-amber-200 px-0 text-left text-black shadow-2xl shadow-black/40 transition-all md:bottom-6 md:right-6 ${scrolled ? "md:hover:w-64 md:hover:px-4 md:focus:w-64 md:focus:px-4" : "md:h-auto md:w-72 md:px-4 md:py-3"}`}
        aria-label={`Open My Itinerary with ${items.length} selections`}
      >
        <CalendarPlus className={`mx-auto h-5 w-5 shrink-0 ${scrolled ? "md:group-hover:mx-0 md:group-focus:mx-0" : "md:hidden"}`} />
        {items.length ? <span className={`absolute right-0 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-700 px-1 text-[10px] font-black text-white ${scrolled ? "md:group-hover:hidden md:group-focus:hidden" : "md:hidden"}`}>{items.length}</span> : null}
        <span className={`hidden whitespace-nowrap ${scrolled ? "md:ml-3 md:group-hover:block md:group-focus:block" : "md:block"}`}>
          <span className="block text-xs font-black uppercase tracking-[0.16em]">My Itinerary</span>
          <span className="block text-sm font-bold">{items.length ? `${items.length} pick${items.length === 1 ? "" : "s"} saved` : "Start adding places"}</span>
        </span>
        <ChevronRight className={`hidden h-5 w-5 shrink-0 ${scrolled ? "md:group-hover:block md:group-focus:block" : "md:block"}`} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/65" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setOpen(false);
        }}>
          <aside role="dialog" aria-modal="true" aria-label="My Itinerary selections" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0d0b12] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Build as you browse</p>
                <h2 className="mt-1 text-2xl font-black text-white">My Itinerary <span className="text-white/45">({items.length})</span></h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close My Trip" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {items.length ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">{categoryLabels[item.category]}</p>
                          <Link href={item.detailUrl} onClick={() => setOpen(false)} className="mt-1 block text-lg font-black text-white hover:text-amber-100">{item.name}</Link>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/55"><MapPin className="h-3.5 w-3.5" /> {item.area}</p>
                        </div>
                        <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={clearItems} className="px-2 py-2 text-sm font-bold text-white/55 hover:text-white">Clear all selections</button>
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <CalendarPlus className="h-8 w-8 text-amber-100" />
                  <h3 className="mt-4 text-xl font-black text-white">Your itinerary is empty</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/60">Add hotels, restaurants, events, and flexible stops as you browse. We will use them when the itinerary builds.</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <Link href="/my-trip" onClick={() => setOpen(false)} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 font-black transition ${items.length ? "bg-white text-black hover:bg-amber-100" : "pointer-events-none bg-white/10 text-white/35"}`}>
                Review My Itinerary <ChevronRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs leading-5 text-white/40">Your selections stay on this browser until you clear them.</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
