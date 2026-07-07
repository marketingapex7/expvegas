"use client";

import { Mail, RefreshCw, Ticket } from "lucide-react";
import { FormEvent } from "react";
import { PlannerResponse } from "@/types/planner";

type TuneOption = {
  label: string;
  updates: Partial<Record<string, string>>;
};

type PlanResultProps = {
  result: PlannerResponse;
  shareUrl?: string;
  email?: string;
  savingEmail?: boolean;
  emailMessage?: string;
  onEmailChange?: (email: string) => void;
  onEmailSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  tuneOptions?: TuneOption[];
  onTune?: (updates: Partial<Record<string, string>>) => void;
  loading?: boolean;
  saveStatus?: string;
};

function actionForCategory(category: string, bookingUrl?: string) {
  if (category === "event" && bookingUrl) return "Check Tickets";
  if (category === "meal") return "Reserve Table";
  if (category === "attraction") return "View Nearby";
  if (category === "casino") return "Map It";
  if (category === "shopping") return "Window Shop";
  if (category === "free") return "Explore";
  return "Swap Pick";
}

export function PlanResult({
  result,
  shareUrl,
  email = "",
  savingEmail = false,
  emailMessage,
  onEmailChange,
  onEmailSubmit,
  tuneOptions = [],
  onTune,
  loading = false,
  saveStatus,
}: PlanResultProps) {
  return (
    <div className="mx-auto mt-5 rounded-lg border border-amber-100/20 bg-white/[0.07] p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">{result.headline}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight text-white">{result.bestPickName}</h2>
      <p className="mt-3 leading-7 text-white/70">{result.whyItFits}</p>
      {result.sourceSummary ? <p className="mt-3 text-sm font-bold text-white/45">{result.sourceSummary}</p> : null}
      {shareUrl ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-black text-white">Saved plan link</p>
          <a href={shareUrl} className="mt-2 block break-all text-sm font-bold text-amber-100 hover:text-white">
            {shareUrl}
          </a>
        </div>
      ) : saveStatus ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-black text-white">Plan save status</p>
          <p className="mt-2 text-sm font-bold text-amber-100">{saveStatus}</p>
        </div>
      ) : null}
      {result.tripSummary ? (
        <section className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Trip summary</p>
              <p className="mt-3 text-sm leading-6 text-white/68">{result.tripSummary.whyThisPlanWorks}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Staying</p>
                  <p className="mt-2 text-sm font-black text-white">{result.tripSummary.lodging}</p>
                </div>
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Spend</p>
                  <p className="mt-2 text-sm font-black text-white">{result.tripSummary.estimatedSpend}</p>
                </div>
                <div className="rounded-lg bg-white/[0.06] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Style</p>
                  <p className="mt-2 text-sm font-black text-white">{result.tripSummary.tripStyle.join(" / ")}</p>
                </div>
              </div>
              {result.tripSummary.bestLodgingZone ? (
                <div className="mt-3 rounded-lg border border-amber-100/20 bg-amber-100/[0.07] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">Best lodging zone</p>
                  <p className="mt-2 text-sm leading-6 text-white/72">{result.tripSummary.bestLodgingZone}</p>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-lg bg-white/[0.06] p-4">
                <p className="text-sm font-black text-white">Book now</p>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  {result.tripSummary.bookNow.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-white/[0.06] p-4">
                <p className="text-sm font-black text-white">Keep flexible</p>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  {result.tripSummary.keepFlexible.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ) : null}
      {result.itineraryDays?.length ? (
        <div className="mt-5 grid gap-4">
          {result.itineraryDays.map((day) => (
            <section key={day.date} className="rounded-lg bg-black/20 p-4">
              <p className="text-sm font-black text-amber-100">{day.label}</p>
              <h3 className="mt-1 text-xl font-black text-white">{day.theme}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {day.blocks.map((block) => (
                  <div key={`${day.date}-${block.time}-${block.title}`} className="rounded-lg bg-black/25 p-4">
                    <p className="text-sm font-black text-amber-100">{block.time}</p>
                    <p className="mt-1 font-bold text-white">{block.title}</p>
                    {block.location ? <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">{block.location}</p> : null}
                    {block.description ? <p className="mt-2 text-sm leading-6 text-white/60">{block.description}</p> : null}
                    {block.priceHint ? <p className="mt-2 text-sm font-bold text-white/70">{block.priceHint}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {block.bookingUrl ? (
                        <a href={block.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-amber-100">
                          <Ticket className="h-3.5 w-3.5" /> {actionForCategory(block.category, block.bookingUrl)}
                        </a>
                      ) : (
                        <button type="button" className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white/72 transition hover:bg-white/10">
                          {actionForCategory(block.category)}
                        </button>
                      )}
                      <button type="button" className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white/72 transition hover:bg-white/10">
                        Swap Pick
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
            Send this game plan
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="Email address"
              className="min-h-11 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-amber-100/70"
            />
          </label>
          <button disabled={savingEmail} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-lg bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-70">
            <Mail className="h-4 w-4" /> {savingEmail ? "Saving..." : "Save Plan"}
          </button>
          {emailMessage ? <p className="text-sm font-bold text-amber-100 sm:col-span-2">{emailMessage}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
