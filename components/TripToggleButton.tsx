"use client";

import { Check, Plus } from "lucide-react";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { TripPick } from "@/types/directory";

export function TripToggleButton({ item, compact = false, theme = "dark" }: { item: TripPick; compact?: boolean; theme?: "dark" | "light" }) {
  const { hasItem, toggleItem, hydrated } = useTripSelections();
  const added = hydrated && hasItem(item.id);

  return (
    <button
      type="button"
      aria-pressed={added}
      onClick={() => toggleItem(item)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition ${
        added
          ? "border-amber-200/40 bg-amber-200 text-black hover:bg-amber-100"
          : theme === "light"
            ? "border-zinc-900 bg-zinc-900 text-white hover:bg-fuchsia-800"
            : "border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
      } ${compact ? "min-h-10 px-3 py-2 text-xs" : ""}`}
    >
      {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {added ? "Added to Itinerary" : "Add to Itinerary"}
    </button>
  );
}
