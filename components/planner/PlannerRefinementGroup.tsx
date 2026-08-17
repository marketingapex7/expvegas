import { PlannerChip } from "@/components/planner/PlannerChip";

type RefinementGroup = {
  label: string;
  key: string;
  multi: boolean;
  options: readonly string[];
};

/** One labelled card of refinement chips, single- or multi-select. */
export function PlannerRefinementGroup({
  group,
  selectedValue,
  selectedValues,
  onSelect,
}: {
  group: RefinementGroup;
  selectedValue?: string;
  selectedValues?: string[];
  onSelect: (key: string, option: string, multi: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/50">{group.label}</p>
      {group.multi ? <p className="mb-2 text-[11px] font-semibold text-white/45">Choose all that fit.</p> : null}
      <div className="flex flex-wrap gap-2">
        {group.options.map((option) => (
          <PlannerChip
            key={option}
            label={option}
            isSelected={group.multi ? Boolean(selectedValues?.includes(option)) : selectedValue === option}
            onSelect={() => onSelect(group.key, option, group.multi)}
          />
        ))}
      </div>
    </div>
  );
}
