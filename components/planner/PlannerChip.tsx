import { ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * The selectable chip used by every trip-builder group. It was duplicated three
 * times inline, so a styling or accessibility fix had to be made in three
 * places and the checkbox affordance had already drifted between them.
 */
export function PlannerChip({
  label,
  isSelected,
  onSelect,
  fullWidthOnDesktop = false,
  leading,
}: {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  /** Helper groups stack their chips into a column on wide screens. */
  fullWidthOnDesktop?: boolean;
  leading?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`group/option inline-flex min-h-11 items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm font-bold leading-5 shadow-sm transition ${
        fullWidthOnDesktop ? "md:w-full" : ""
      } ${
        isSelected
          ? "border-amber-100 bg-amber-200 text-zinc-950 shadow-[0_7px_18px_rgba(251,191,36,0.16)]"
          : "border-white/14 bg-black/25 text-white/80 hover:border-amber-100/45 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition ${
          isSelected
            ? "border-zinc-950/30 bg-zinc-950 text-amber-100"
            : "border-white/25 bg-white/[0.04] group-hover/option:border-amber-100/60"
        }`}
      >
        {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
      </span>
      {leading}
      <span>{label}</span>
    </button>
  );
}
