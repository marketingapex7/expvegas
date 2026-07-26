"use client";

import { Clock, MapPin, RefreshCw, Ticket } from "lucide-react";
import { CardImage } from "@/components/CardImage";
import { PlanDayRouteMap } from "@/components/PlanDayRouteMap";
import { directoryListings } from "@/lib/directory-data";
import { estimateVegasTravel } from "@/lib/vegas-logistics";
import { seedEvents } from "@/data/seed-events";
import { ItineraryBlock, ItineraryDay } from "@/types/planner";

type PlanItineraryWorkspaceProps = {
  itineraryDays: ItineraryDay[];
  activeDayIndex: number;
  onDayChange: (index: number) => void;
  onSwap: (day: ItineraryDay, block: ItineraryBlock, index: number) => void;
};

function validBookingUrl(url?: string) {
  return Boolean(url && url !== "#");
}

function fallbackExploreUrl(title: string, location?: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${location || "Las Vegas"}`)}`;
}

function actionForCategory(block: ItineraryBlock) {
  if (validBookingUrl(block.bookingUrl)) {
    if (block.category === "event") return "Check tickets";
    if (block.category === "meal") return "Reserve table";
    if (block.provider === "go-city") return "Compare pass";
    return "Check entry";
  }
  if (block.category === "casino") return "Map it";
  return "Directions";
}

function planningLabel(category: ItineraryBlock["category"]) {
  if (category === "free") return "Free / flexible";
  if (category === "shopping") return "No ticket needed";
  if (category === "casino") return "Optional casino time";
  return undefined;
}

function imageForBlock(block: ItineraryBlock) {
  const normalized = block.title.toLowerCase();
  const listing = directoryListings.find((item) => item.name.toLowerCase() === normalized);
  if (listing) return listing.imageUrl;
  return seedEvents.find((event) => event.name.toLowerCase() === normalized)?.imageUrl;
}

function imageCategory(block: ItineraryBlock): "restaurant" | "event" | "attraction" | "free" | "shopping" {
  if (block.category === "meal") return "restaurant";
  if (block.category === "event") return "event";
  if (block.category === "shopping") return "shopping";
  if (block.category === "free" || block.category === "transit") return "free";
  return "attraction";
}

function travelContext(previous?: ItineraryBlock, current?: ItineraryBlock) {
  if (!previous || !current) return undefined;
  if (!previous.location || !current.location) return "Allow a short buffer before the next stop";

  const estimate = estimateVegasTravel(previous.location, current.location);
  const mode = estimate.maxMinutes <= 10
    ? "walk"
    : estimate.fromZone === estimate.toZone
      ? "walk or rideshare"
      : "rideshare";
  return `${estimate.minMinutes}-${estimate.maxMinutes} min by ${mode}`;
}

function TimelineCard({
  block,
  number,
  onSwap,
}: {
  block: ItineraryBlock;
  number: number;
  onSwap: () => void;
}) {
  const imageUrl = imageForBlock(block);
  const actionUrl = validBookingUrl(block.bookingUrl)
    ? block.bookingUrl!
    : fallbackExploreUrl(block.title, block.location);
  const bookingAction = validBookingUrl(block.bookingUrl);
  const label = planningLabel(block.category);

  return (
    <article className="relative rounded-lg border border-zinc-200 bg-white shadow-[0_5px_18px_rgba(24,16,24,0.05)]">
      <span className="absolute -left-[3.15rem] top-4 z-10 inline-flex h-8 min-w-8 items-center justify-center rounded-full border-4 border-[#f6f4f7] bg-fuchsia-950 px-1 text-xs font-black text-white">
        {number}
      </span>
      <div className="grid grid-cols-[minmax(0,1fr)_5.25rem] gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-5">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-fuchsia-800">{block.time}</p>
          <h4 className="mt-1 text-lg font-black leading-tight text-zinc-950 sm:text-xl">{block.title}</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {block.location ? <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-black text-zinc-600">{block.location}</span> : null}
            {block.durationMinutes ? <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-black text-zinc-600">{Math.round(block.durationMinutes / 15) * 15} min</span> : null}
            {block.priceHint ? <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-black text-zinc-600">{block.priceHint}</span> : null}
            {label ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800">{label}</span> : null}
          </div>
          {block.description ? <p className="mt-3 hidden text-sm leading-6 text-zinc-600 sm:block">{block.description}</p> : null}
          {block.timingNote ? <p className="mt-2 text-xs font-bold text-amber-800">{block.timingNote}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={actionUrl}
              target="_blank"
              rel={block.provider === "go-city" ? "noopener noreferrer sponsored" : "noopener noreferrer"}
              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-black transition ${
                bookingAction ? "bg-amber-300 text-zinc-950 hover:bg-amber-200" : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              {bookingAction ? <Ticket className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              {actionForCategory(block)}
            </a>
            <button type="button" onClick={onSwap} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-zinc-300 px-3 text-xs font-black text-zinc-700 transition hover:bg-zinc-50">
              <RefreshCw className="h-3.5 w-3.5" /> Swap
            </button>
          </div>
        </div>
        <div className="relative h-20 overflow-hidden rounded-md bg-zinc-900 sm:h-28">
          <CardImage src={imageUrl} alt={block.title} category={imageCategory(block)} sizes="(max-width: 640px) 84px, 144px" fallbackLabel={false} />
        </div>
      </div>
    </article>
  );
}

export function PlanItineraryWorkspace({
  itineraryDays,
  activeDayIndex,
  onDayChange,
  onSwap,
}: PlanItineraryWorkspaceProps) {
  const activeDay = itineraryDays[activeDayIndex] || itineraryDays[0];
  if (!activeDay) return null;

  return (
    <section data-testid="timed-itinerary" className="min-w-0">
      <nav aria-label="Choose itinerary day" className="sticky top-[4.5rem] z-20 flex gap-1.5 overflow-x-auto rounded-lg border border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur-xl">
        {itineraryDays.map((day, index) => (
          <button
            key={day.date}
            type="button"
            aria-pressed={index === activeDayIndex}
            onClick={() => onDayChange(index)}
            className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-black transition ${
              index === activeDayIndex ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            Day {index + 1}
          </button>
        ))}
      </nav>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-fuchsia-800">{activeDay.label}</p>
          <h3 className="mt-1 text-2xl font-black leading-tight text-zinc-950">{activeDay.theme}</h3>
        </div>
        <span className="hidden shrink-0 rounded-full bg-zinc-200 px-3 py-1.5 text-xs font-black text-zinc-700 sm:inline-flex">
          {activeDay.blocks.length} stops
        </span>
      </div>

      <div className="mt-4">
        <PlanDayRouteMap day={activeDay} />
      </div>

      <div className="relative mt-5 space-y-3 pl-11 sm:pl-14">
        <div aria-hidden="true" className="absolute bottom-4 left-[0.95rem] top-4 w-0.5 bg-zinc-300 sm:left-[1.05rem]" />
        {activeDay.blocks.map((block, index) => {
          const travel = travelContext(activeDay.blocks[index - 1], block);
          return (
            <div key={`${activeDay.date}-${block.time}-${block.title}`}>
              {travel ? (
                <div className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-[#f6f4f7] px-3 py-1.5 text-xs font-black text-zinc-600">
                  <Clock className="h-3.5 w-3.5" /> {travel}
                </div>
              ) : null}
              <TimelineCard block={block} number={index + 1} onSwap={() => onSwap(activeDay, block, index)} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
