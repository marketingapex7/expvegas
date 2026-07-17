"use client";

import { Check, Plus } from "lucide-react";
import { useTripSelections } from "@/components/TripSelectionProvider";
import { TripPick } from "@/types/directory";

export function TripToggleButton({ item, compact = false, theme = "dark", variant = "solid" }: { item: TripPick; compact?: boolean; theme?: "dark" | "light"; variant?: "solid" | "bare" }) {
  const { hasItem, toggleItem, hydrated } = useTripSelections();
  const added = hydrated && hasItem(item.id);

  return (
    <button
      type="button"
      aria-pressed={added}
      onClick={() => toggleItem(item)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${
        variant === "bare"
          ? added
            ? "bg-amber-100 text-amber-950 hover:bg-amber-200"
            : theme === "light"
              ? "text-zinc-900 hover:bg-zinc-100"
              : "text-white hover:bg-white/10"
          : added
            ? "border border-amber-200/40 bg-amber-200 text-black hover:bg-amber-100"
            : theme === "light"
              ? "border border-zinc-900 bg-zinc-900 text-white hover:bg-fuchsia-800"
              : "border border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
      } ${compact ? "min-h-10 px-3 py-2 text-xs" : ""}`}
    >
      {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {added ? "Added to Itinerary" : "Add to Itinerary"}
    </button>
  );
}
