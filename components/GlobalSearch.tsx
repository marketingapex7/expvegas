"use client";

import { Search, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

const GlobalSearchDialog = lazy(() => import("@/components/GlobalSearchDialog").then((module) => ({
  default: module.GlobalSearchDialog,
})));

function SearchDialogLoading({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/75 px-4 pt-[12vh] backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label="Search ExperienceVegas" aria-busy="true" className="mx-auto max-w-2xl overflow-hidden rounded-lg border border-white/15 bg-[#100e15] shadow-2xl">
        <div className="flex items-center gap-3 p-3">
          <Search className="ml-2 h-5 w-5 shrink-0 text-amber-100" />
          <p className="min-h-11 min-w-0 flex-1 py-3 text-sm font-bold text-white/55">Opening Vegas search...</p>
          <button type="button" onClick={onClose} aria-label="Close search" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search Vegas" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white transition hover:bg-white/10">
        <Search className="h-4 w-4" />
      </button>
      {open ? (
        <Suspense fallback={<SearchDialogLoading onClose={() => setOpen(false)} />}>
          <GlobalSearchDialog onClose={() => setOpen(false)} />
        </Suspense>
      ) : null}
    </>
  );
}
