"use client";

import { CalendarPlus, Check, Copy, Mail, MapPin, RefreshCw, Ticket } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { attractionStops, casinoStops, freeExperienceStops, PlanningStop } from "@/data/planning-stops";
import { restaurants, VegasRestaurant } from "@/data/restaurants";
import { seedEvents } from "@/data/seed-events";
import { sanitizeSchedule } from "@/lib/itinerary-engine";
import { ItineraryBlock, ItineraryDay, PlannerEventOption, PlannerResponse } from "@/types/planner";
import { PlanBookingChecklist } from "@/components/PlanBookingChecklist";
import { PlanTripDetails } from "@/components/PlanTripDetails";
import { PrintPlanButton } from "@/components/PrintPlanButton";
import { PrintableGeneratedPlan } from "@/components/PrintableItinerary";

type TuneOption = {
  label: string;
  updates: Partial<Record<string, string>>;
};

type PlanResultProps = {
  result: PlannerResponse;
  shareUrl?: string;
  expiresAt?: string;
  email?: string;
  savingEmail?: boolean;
  emailMessage?: string;
  onEmailChange?: (email: string) => void;
  onEmailSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  tuneOptions?: TuneOption[];
  onTune?: (updates: Partial<Record<string, string>>) => void;
  loading?: boolean;
  saveStatus?: string;
  savingPlan?: boolean;
  onSaveRetry?: () => void;
};

function actionForCategory(category: string, bookingUrl?: string) {
  if (category === "event" && bookingUrl && bookingUrl !== "#") return "Check Tickets";
  if (category === "meal") return "Reserve Table";
  if (category === "attraction") return "View Nearby";
  if (category === "casino") return "Map It";
  if (category === "shopping") return "Window Shop";
  if (category === "free") return "Explore";
  return "Explore";
}

function fallbackExploreUrl(title: string, location?: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${location || "Las Vegas"}`)}`;
}

function validBookingUrl(url?: string) {
  return Boolean(url && url !== "#");
}

function travelContext(previous?: ItineraryBlock, current?: ItineraryBlock) {
  if (!previous || !current) return "Start from your hotel or arrival point";
  if (!previous.location || !current.location) return "Allow a short buffer between stops";

  const previousLocation = previous.location.toLowerCase();
  const currentLocation = current.location.toLowerCase();
  if (previousLocation.includes(currentLocation) || currentLocation.includes(previousLocation)) {
    return "Same-area stop, so this should be an easy walk";
  }

  return "Allow roughly 15-25 min by rideshare between areas";
}

function planningLabel(category: ItineraryBlock["category"]) {
  if (category === "free") return "Free / flexible";
  if (category === "shopping") return "No ticket needed";
  if (category === "casino") return "Optional casino time";
  return "";
}

function icsEscape(value: string) {
  return value.replace(/[\\;,]/g, (character) => `\\${character}`).replace(/\r?\n/g, "\\n");
}

function timeParts(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: 12, minute: 0 };

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function icsDate(value: Date) {
  return `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, "0")}${String(value.getDate()).padStart(2, "0")}T${String(value.getHours()).padStart(2, "0")}${String(value.getMinutes()).padStart(2, "0")}00`;
}

function icsUtcDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function blockKey(planId: string, day: ItineraryDay, _block: ItineraryBlock, index: number) {
  // Keep the identity tied to the slot, so a second swap still advances the same pick.
  return `${planId}-${day.date}-${index}`;
}

function restaurantToBlock(restaurant: VegasRestaurant, current: ItineraryBlock): ItineraryBlock {
  return {
    ...current,
    title: restaurant.name,
    location: restaurant.venue || restaurant.area,
    description: restaurant.description,
    bookingUrl: restaurant.reservationUrl,
    priceHint: undefined,
  };
}

function stopToBlock(stop: PlanningStop, current: ItineraryBlock): ItineraryBlock {
  return {
    ...current,
    title: stop.name,
    location: stop.area,
    description: stop.description,
    bookingUrl: undefined,
    priceHint: undefined,
  };
}

function formatEventTime(localTime?: string) {
  if (!localTime) return undefined;
  const [rawHour, rawMinute] = localTime.split(":").map(Number);
  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) return undefined;
  const period = rawHour >= 12 ? "PM" : "AM";
  return `${rawHour % 12 || 12}:${String(rawMinute).padStart(2, "0")} ${period}`;
}

function eventOptionsForResult(result: PlannerResponse): PlannerEventOption[] {
  if (result.eventOptions?.length) return result.eventOptions;

  return [result.bestPickName, ...result.backupPickNames].map((name) => {
    const event = seedEvents.find((item) => item.name === name);
    return event
      ? {
          id: event.id,
          name: event.name,
          category: event.category,
          venueName: event.venueName,
          quickVerdict: event.quickVerdict,
          affiliateUrl: event.affiliateUrl,
          priceMin: event.priceMin,
          priceMax: event.priceMax,
          runtimeMinutes: event.runtimeMinutes,
          localDate: event.localDate,
          localTime: event.localTime,
        }
      : {
          id: name,
          name,
          category: "shows" as const,
          venueName: "Las Vegas",
          quickVerdict: "A backup event pick for this part of the trip.",
        };
  });
}

function eventToBlock(event: PlannerEventOption, current: ItineraryBlock): ItineraryBlock {
  const actualTime = formatEventTime(event.localTime);

  return {
    ...current,
    time: actualTime || current.time,
    title: event.name,
    location: event.venueName,
    description: event.quickVerdict,
    bookingUrl: validBookingUrl(event.affiliateUrl) ? event.affiliateUrl : undefined,
    priceHint: event.priceMin ? (event.priceMax ? `$${event.priceMin}-${event.priceMax}` : `From $${event.priceMin}`) : undefined,
    durationMinutes: event.runtimeMinutes || current.durationMinutes,
  };
}

function pickNext<T extends { name: string }>(items: T[], currentName: string, count: number) {
  const options = items.filter((item) => item.name !== currentName);
  if (options.length === 0) return undefined;
  return options[(count - 1) % options.length];
}

function swapBlock(block: ItineraryBlock, count: number, result: PlannerResponse, dayDate: string): ItineraryBlock {
  if (count < 1) return block;

  if (block.category === "meal") {
    const next = pickNext(restaurants, block.title, count);
    return next ? restaurantToBlock(next, block) : block;
  }

  if (block.category === "casino") {
    const next = pickNext(casinoStops, block.title, count);
    return next ? stopToBlock(next, block) : block;
  }

  if (block.category === "attraction") {
    const next = pickNext(attractionStops, block.title, count);
    return next ? stopToBlock(next, block) : block;
  }

  if (block.category === "free" || block.category === "shopping") {
    const next = pickNext(freeExperienceStops, block.title, count);
    return next ? stopToBlock(next, block) : block;
  }

  if (block.category === "event") {
    const eventOptions = eventOptionsForResult(result).filter(
      (event) => event.name !== block.title && (!event.localDate || event.localDate === dayDate),
    );
    const nextEvent = eventOptions[(count - 1) % eventOptions.length];
    return nextEvent ? eventToBlock(nextEvent, block) : block;
  }

  return block;
}

export function PlanResult({
  result,
  shareUrl,
  expiresAt,
  email = "",
  savingEmail = false,
  emailMessage,
  onEmailChange,
  onEmailSubmit,
  tuneOptions = [],
  onTune,
  loading = false,
  saveStatus,
  savingPlan = false,
  onSaveRetry,
}: PlanResultProps) {
  const [swapCounts, setSwapCounts] = useState<Record<string, number>>({});
  const [copyStatus, setCopyStatus] = useState("");
  const [swapStatus, setSwapStatus] = useState("");
  const [calendarStatus, setCalendarStatus] = useState("");
  const planId = result.bestPickId || result.bestPickName;

  const itineraryDays = useMemo(
    () =>
      result.itineraryDays?.map((day) => ({
        ...day,
        blocks: sanitizeSchedule(
          day.blocks.map((block, index) =>
            swapBlock(block, swapCounts[blockKey(planId, day, block, index)] || 0, result, day.date),
          ),
        ),
      })),
    [planId, result, swapCounts],
  );

  async function persistSwap(nextResult: PlannerResponse) {
    const token = shareUrl?.split("/").filter(Boolean).pop();
    if (!token) return;

    setSwapStatus("Saving change...");
    const response = await fetch(`/api/plans/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: nextResult }),
    });

    setSwapStatus(response.ok ? "Saved" : "Could not save this swap");
    window.setTimeout(() => setSwapStatus(""), 2200);
  }

  function handleSwap(day: ItineraryDay, block: ItineraryBlock, index: number) {
    const key = blockKey(planId, day, block, index);
    const nextCounts = { ...swapCounts, [key]: (swapCounts[key] || 0) + 1 };
    setSwapCounts(nextCounts);

    const nextItineraryDays = result.itineraryDays?.map((itineraryDay) => ({
      ...itineraryDay,
      blocks: sanitizeSchedule(
        itineraryDay.blocks.map((itineraryBlock, itineraryIndex) =>
          swapBlock(
            itineraryBlock,
            nextCounts[blockKey(planId, itineraryDay, itineraryBlock, itineraryIndex)] || 0,
            result,
            itineraryDay.date,
          ),
        ),
      ),
    }));

    if (nextItineraryDays) {
      void persistSwap({ ...result, itineraryDays: nextItineraryDays });
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(new URL(shareUrl, window.location.origin).toString());
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy unavailable");
    }

    window.setTimeout(() => setCopyStatus(""), 2200);
  }

  function downloadCalendar() {
    if (!itineraryDays?.length) return;

    const events = itineraryDays.flatMap((day) =>
      day.blocks.map((block, index) => {
        const { hour, minute } = timeParts(block.time);
        const start = new Date(`${day.date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
        const end = new Date(start.getTime() + (block.durationMinutes || 60) * 60 * 1000);
        return [
          "BEGIN:VEVENT",
          `UID:experiencevegas-${day.date}-${index}-${encodeURIComponent(block.title)}@experiencevegas.com`,
          `DTSTAMP:${icsUtcDate(new Date())}`,
          `DTSTART;TZID=America/Los_Angeles:${icsDate(start)}`,
          `DTEND;TZID=America/Los_Angeles:${icsDate(end)}`,
          `SUMMARY:${icsEscape(block.title)}`,
          block.location ? `LOCATION:${icsEscape(block.location)}` : "",
          block.description ? `DESCRIPTION:${icsEscape(block.description)}` : "",
          "END:VEVENT",
        ].filter(Boolean).join("\r\n");
      }),
    );
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ExperienceVegas//Vegas Game Plan//EN",
      "CALSCALE:GREGORIAN",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "experiencevegas-game-plan.ics";
    link.click();
    URL.revokeObjectURL(url);
    setCalendarStatus("Calendar downloaded");
    window.setTimeout(() => setCalendarStatus(""), 2200);
  }

  return (
    <div className="mx-auto mt-4 rounded-lg border border-amber-100/20 bg-white/[0.07] p-3 sm:mt-5 sm:p-5">
      <div className="mb-4 rounded-lg border border-amber-100/25 bg-black/25 p-3 sm:mb-5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-white">{shareUrl ? "Your game plan is saved" : "Save this itinerary"}</p>
            {shareUrl ? (
              <>
                <a href={shareUrl} className="mt-2 hidden break-all text-sm font-bold text-amber-100 hover:text-white sm:block">
                  {shareUrl}
                </a>
                <p className="mt-2 hidden text-xs font-bold text-white/45 sm:block">
                  {expiresAt
                    ? `Private link available through ${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(expiresAt))}.`
                    : "Private links are available for 30 days after the plan is created."}
                </p>
              </>
            ) : (
              <p className="mt-2 hidden text-sm font-bold text-white/58 sm:block">
                {saveStatus || "We will create a private return link so the itinerary survives clicks away from this page."}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            {itineraryDays?.length ? <PrintPlanButton theme="dark" /> : null}
            {itineraryDays?.length ? (
              <button
                type="button"
                onClick={downloadCalendar}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                <CalendarPlus className="h-4 w-4" /> Add to calendar
              </button>
            ) : null}
            {shareUrl ? (
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-200 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-100"
              >
                {copyStatus === "Copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copyStatus || "Copy link"}
              </button>
            ) : onSaveRetry ? (
              <button
                type="button"
                onClick={onSaveRetry}
                disabled={savingPlan}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-200 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-70"
              >
                {savingPlan ? "Saving..." : "Save Link"}
              </button>
            ) : null}
          </div>
        </div>
        {swapStatus ? <p className="mt-3 text-xs font-bold text-amber-100">{swapStatus}</p> : null}
        {calendarStatus ? <p className="mt-3 text-xs font-bold text-amber-100">{calendarStatus}</p> : null}
      </div>
      <div className="hidden md:block">
        <PlanTripDetails result={result} />
      </div>
      <div className="md:hidden">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">Your Vegas game plan</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-white">{result.bestPickName}</h2>
      </div>
      {itineraryDays?.length ? <PlanBookingChecklist planId={planId} itineraryDays={itineraryDays} /> : null}
      {itineraryDays?.length ? (
        <div data-testid="timed-itinerary" className="mt-5 grid gap-4">
          <nav aria-label="Jump to itinerary day" className="sticky top-[4.5rem] z-10 -mx-1 flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-black/80 p-2 backdrop-blur-xl">
            {itineraryDays.map((day, index) => (
              <a key={day.date} href={`#itinerary-${day.date}`} className="shrink-0 rounded-lg bg-white/[0.08] px-3 py-2 text-xs font-black text-white/70 transition hover:bg-amber-200 hover:text-black">
                Day {index + 1} · {day.label}
              </a>
            ))}
          </nav>
          {itineraryDays.map((day) => (
            <section key={day.date} id={`itinerary-${day.date}`} className="scroll-mt-24 rounded-lg bg-black/20 p-4">
              <p className="text-sm font-black text-amber-100">{day.label}</p>
              <h3 className="mt-1 text-xl font-black text-white">{day.theme}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {day.blocks.map((block, index) => (
                  <div key={`${day.date}-${block.time}-${block.title}`} className="rounded-lg bg-black/25 p-4">
                    <p className="text-sm font-black text-amber-100">{block.time}</p>
                    <p className="mt-1 font-bold text-white">{block.title}</p>
                    {planningLabel(block.category) ? <p className="mt-2 inline-flex rounded-full bg-amber-200/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-amber-100">{planningLabel(block.category)}</p> : null}
                    {block.location ? <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">{block.location}</p> : null}
                    {block.description ? <p className="mt-2 text-sm leading-6 text-white/60">{block.description}</p> : null}
                    {block.durationMinutes ? <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/40">Plan for about {Math.round(block.durationMinutes / 15) * 15} min</p> : null}
                    {block.timingNote ? <p className="mt-2 text-xs font-bold text-amber-100">{block.timingNote}</p> : null}
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white/45"><MapPin className="h-3.5 w-3.5" /> {travelContext(day.blocks[index - 1], block)}</p>
                    {block.priceHint ? <p className="mt-2 text-sm font-bold text-white/70">{block.priceHint}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={validBookingUrl(block.bookingUrl) ? block.bookingUrl : fallbackExploreUrl(block.title, block.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black transition ${
                          validBookingUrl(block.bookingUrl)
                            ? "bg-white text-black hover:bg-amber-100"
                            : "border border-white/15 text-white/72 hover:bg-white/10"
                        }`}
                      >
                        {validBookingUrl(block.bookingUrl) ? <Ticket className="h-3.5 w-3.5" /> : null}
                        {actionForCategory(block.category, block.bookingUrl)}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleSwap(day, block, index)}
                        className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white/72 transition hover:bg-white/10"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Swap Pick
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {result.timeline.map((item) => (
            <div key={`${item.time}-${item.title}`} className="rounded-lg bg-black/25 p-4">
              <p className="text-sm font-black text-amber-100">{item.time}</p>
              <p className="mt-1 font-bold text-white">{item.title}</p>
              {item.description ? <p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p> : null}
            </div>
          ))}
        </div>
      )}
      <details data-testid="mobile-trip-details" className="mt-5 rounded-lg border border-white/10 bg-black/20 md:hidden">
        <summary className="cursor-pointer list-none px-4 py-4 text-sm font-black text-white">
          <span className="flex items-center justify-between gap-3">
            Trip details
            <span aria-hidden="true" className="text-amber-100">+</span>
          </span>
        </summary>
        <div className="border-t border-white/10 p-4">
          <PlanTripDetails result={result} />
        </div>
      </details>
      {result.backupPickNames.length > 0 ? (
        <p className="mt-4 text-sm text-white/55">
          Backup picks: <span className="font-bold text-white/72">{result.backupPickNames.join(" / ")}</span>
        </p>
      ) : null}
      {tuneOptions.length > 0 && onTune ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-black text-white">Tune this game plan</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tuneOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onTune(option.updates)}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/75 transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" /> {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {onEmailSubmit && onEmailChange ? (
        <form onSubmit={onEmailSubmit} className="mt-4 grid gap-3 rounded-lg border border-amber-100/20 bg-amber-100/[0.07] p-4 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-2 text-sm font-bold text-white/70">
            Save email for this plan
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="Email address"
              className="min-h-11 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-amber-100/70"
            />
          </label>
          <button disabled={savingEmail} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-lg bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-70">
            <Mail className="h-4 w-4" /> {savingEmail ? "Saving..." : "Attach Email"}
          </button>
          {emailMessage ? <p className="text-sm font-bold text-amber-100 sm:col-span-2">{emailMessage}</p> : null}
        </form>
      ) : null}
      {itineraryDays?.length ? <PrintableGeneratedPlan title={result.headline} days={itineraryDays} /> : null}
    </div>
  );
}
