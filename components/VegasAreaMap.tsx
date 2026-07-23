import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { VegasZone } from "@/types/directory";

export type VegasMapItem = {
  id: string;
  name: string;
  area: string;
  zone: VegasZone;
  href: string;
  mapUrl?: string;
  label?: string;
  sequence?: number;
};

const zoneAnchors: Record<VegasZone, { x: number; y: number }> = {
  Downtown: { x: 27, y: 15 },
  "North Strip": { x: 52, y: 30 },
  "Center Strip": { x: 54, y: 48 },
  "South Strip": { x: 57, y: 70 },
  "Off Strip": { x: 80, y: 48 },
};

function markerPosition(items: VegasMapItem[], item: VegasMapItem) {
  const zoneItems = items.filter((entry) => entry.zone === item.zone);
  const index = zoneItems.findIndex((entry) => entry.id === item.id);
  const column = index % 3;
  const row = Math.floor(index / 3);
  const anchor = zoneAnchors[item.zone];

  return {
    left: `${Math.min(92, Math.max(8, anchor.x + (column - 1) * 9))}%`,
    top: `${Math.min(88, Math.max(8, anchor.y + row * 8))}%`,
  };
}

export function VegasAreaMap({
  items,
  title = "Vegas area map",
  testId = "vegas-area-map",
}: {
  items: VegasMapItem[];
  title?: string;
  testId?: string;
}) {
  return (
    <section data-testid={testId} aria-label={title} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700">Relative geography</p>
        <h2 className="mt-1 text-2xl font-black text-zinc-950">{title}</h2>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)]">
        <div className="relative min-h-[30rem] overflow-hidden border-b border-zinc-200 bg-[#f3f1f5] lg:border-b-0 lg:border-r">
          <div aria-hidden="true" className="absolute bottom-[8%] left-[54%] top-[19%] w-8 -translate-x-1/2 border-x border-zinc-300 bg-white/75" />
          <div aria-hidden="true" className="absolute left-[13%] right-[48%] top-[18%] border-t-2 border-zinc-300" />
          <div aria-hidden="true" className="absolute left-[69%] top-[15%] h-[70%] border-l border-dashed border-zinc-300" />
          <span aria-hidden="true" className="absolute left-[8%] top-[8%] text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Downtown</span>
          <span aria-hidden="true" className="absolute left-[57%] top-[22%] text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">North Strip</span>
          <span aria-hidden="true" className="absolute left-[57%] top-[43%] text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Center Strip</span>
          <span aria-hidden="true" className="absolute left-[60%] top-[76%] text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">South Strip</span>
          <span aria-hidden="true" className="absolute right-[5%] top-[37%] text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Off Strip</span>
          <span aria-hidden="true" className="absolute bottom-[12%] left-[49%] -rotate-90 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Las Vegas Blvd</span>
          <span aria-hidden="true" className="absolute right-5 top-4 text-xs font-black text-zinc-400">N</span>

          {items.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              aria-label={`View ${item.name}`}
              title={`${item.name} - ${item.area}`}
              style={markerPosition(items, item)}
              className="group absolute z-10 inline-flex h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-zinc-950 px-2 text-xs font-black text-white shadow-md transition hover:z-20 hover:bg-fuchsia-700 focus:z-20 focus:outline-none focus:ring-4 focus:ring-fuchsia-200"
            >
              {item.sequence || index + 1}
            </Link>
          ))}
        </div>

        <ol className="max-h-[30rem] overflow-y-auto p-4">
          {items.map((item, index) => (
            <li key={item.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-zinc-100 py-3 first:pt-0 last:border-b-0 last:pb-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-xs font-black text-white">{item.sequence || index + 1}</span>
              <div className="min-w-0">
                <Link href={item.href} className="block truncate text-sm font-black text-zinc-950 hover:text-fuchsia-800">{item.name}</Link>
                <p className="mt-1 truncate text-xs font-bold text-zinc-500">{item.area}{item.area === item.zone ? "" : ` · ${item.zone}`}</p>
                {item.label ? <p className="mt-1 text-xs text-zinc-500">{item.label}</p> : null}
                {item.mapUrl ? (
                  <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-xs font-black text-fuchsia-800 hover:text-fuchsia-950">
                    <MapPin className="h-3.5 w-3.5" /> Exact map <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="border-t border-zinc-200 px-5 py-3 text-xs leading-5 text-zinc-500">Relative planning view. Confirm exact routes and current traffic before leaving.</p>
    </section>
  );
}
