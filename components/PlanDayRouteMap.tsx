import { MapPin, Route } from "lucide-react";
import { estimateVegasTravel, inferVegasZone } from "@/lib/vegas-logistics";
import { ItineraryDay } from "@/types/planner";
import { VegasZone } from "@/types/directory";

const zoneAnchors: Record<VegasZone, { x: number; y: number }> = {
  Downtown: { x: 24, y: 20 },
  "North Strip": { x: 51, y: 30 },
  "Center Strip": { x: 54, y: 51 },
  "South Strip": { x: 57, y: 73 },
  "Off Strip": { x: 79, y: 48 },
};

function routeUrl(day: ItineraryDay) {
  const locations = day.blocks.map((block) => block.location).filter((value): value is string => Boolean(value));
  if (locations.length === 0) return undefined;
  if (locations.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locations[0]}, Las Vegas, NV`)}`;
  }

  const origin = locations[0];
  const destination = locations.at(-1)!;
  const waypoints = locations.slice(1, -1);
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin}, Las Vegas, NV`,
    destination: `${destination}, Las Vegas, NV`,
    travelmode: "driving",
  });
  if (waypoints.length) params.set("waypoints", waypoints.map((location) => `${location}, Las Vegas, NV`).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function markerPosition(day: ItineraryDay, blockIndex: number) {
  const block = day.blocks[blockIndex];
  const zone = inferVegasZone(block.location || block.title);
  const sameZoneBefore = day.blocks
    .slice(0, blockIndex)
    .filter((candidate) => inferVegasZone(candidate.location || candidate.title) === zone).length;
  const anchor = zoneAnchors[zone];
  const columnOffset = (sameZoneBefore % 3 - 1) * 8;
  const rowOffset = Math.floor(sameZoneBefore / 3) * 8;

  return {
    left: `${Math.min(91, Math.max(9, anchor.x + columnOffset))}%`,
    top: `${Math.min(86, Math.max(12, anchor.y + rowOffset))}%`,
  };
}

function travelMinutes(day: ItineraryDay) {
  return day.blocks.slice(1).reduce((total, block, index) => {
    const previous = day.blocks[index];
    if (!previous.location || !block.location) return total;
    return total + estimateVegasTravel(previous.location, block.location).maxMinutes;
  }, 0);
}

export function PlanDayRouteMap({ day }: { day: ItineraryDay }) {
  const mappedBlocks = day.blocks.filter((block) => block.location);
  const directionsUrl = routeUrl(day);
  const estimatedTravel = travelMinutes(day);

  return (
    <section aria-label={`${day.label} route overview`} className="overflow-hidden rounded-lg border border-zinc-200 bg-[#f3f1f5]">
      <div className="relative min-h-40 overflow-hidden sm:min-h-48">
        <div aria-hidden="true" className="absolute bottom-[-8%] left-[53%] top-[-8%] w-7 rotate-[4deg] border-x border-zinc-300 bg-white/80" />
        <div aria-hidden="true" className="absolute left-[-5%] right-[-5%] top-[53%] -rotate-[2deg] border-t-2 border-zinc-300" />
        <div aria-hidden="true" className="absolute left-[68%] top-[10%] h-[80%] border-l border-dashed border-zinc-300" />
        <span aria-hidden="true" className="absolute left-[7%] top-[8%] text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Downtown</span>
        <span aria-hidden="true" className="absolute right-[6%] top-[10%] text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Off Strip</span>
        <span aria-hidden="true" className="absolute bottom-[8%] left-[58%] text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">South Strip</span>

        {mappedBlocks.map((block) => {
          const blockIndex = day.blocks.indexOf(block);
          return (
            <span
              key={`${block.time}-${block.title}`}
              title={`${block.time}: ${block.title}`}
              style={markerPosition(day, blockIndex)}
              className="absolute z-10 inline-flex h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-fuchsia-950 px-2 text-xs font-black text-white shadow-md"
            >
              {blockIndex + 1}
            </span>
          );
        })}

        <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-zinc-800 shadow-sm">
          <Route className="h-3.5 w-3.5 text-fuchsia-800" />
          {mappedBlocks.length} mapped stops
          {estimatedTravel > 0 ? ` / allow about ${estimatedTravel} min travel` : ""}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-white px-4 py-3">
        <p className="text-xs font-bold text-zinc-500">Relative Vegas-area view. Confirm live traffic before leaving.</p>
        {directionsUrl ? (
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-fuchsia-800 hover:text-fuchsia-950">
            <MapPin className="h-3.5 w-3.5" /> Open route
          </a>
        ) : null}
      </div>
    </section>
  );
}
