"use client";

import Link from "next/link";
import { CalendarPlus, Check, Copy, Mail, Pencil, RefreshCw } from "lucide-react";
import { FormEvent } from "react";
import { PlanBookingChecklist } from "@/components/PlanBookingChecklist";
import { PlanItineraryWorkspace } from "@/components/PlanItineraryWorkspace";
import { PlanTripDetails } from "@/components/PlanTripDetails";
import { PrintableGeneratedPlan } from "@/components/PrintableItinerary";
import { PrintPlanButton } from "@/components/PrintPlanButton";
import { ItineraryBlock, ItineraryDay, PlannerResponse } from "@/types/planner";

type PlanResultLayoutProps = {
  result: PlannerResponse;
  itineraryDays: ItineraryDay[];
  planId: string;
  activeDayIndex: number;
  onDayChange: (index: number) => void;
  onSwap: (day: ItineraryDay, block: ItineraryBlock, index: number) => void;
  shareUrl?: string;
  expiresAt?: string;
  copyStatus: string;
  onCopyShareLink: () => void;
  onDownloadCalendar: () => void;
  calendarStatus: string;
  swapStatus: string;
  saveStatus?: string;
  savingPlan: boolean;
  onSaveRetry?: () => void;
  onEdit?: () => void;
  tuneOptions: { label: string; updates: Partial<Record<string, string>> }[];
  onTune?: (updates: Partial<Record<string, string>>) => void;
  loading: boolean;
  email: string;
  savingEmail: boolean;
  emailMessage?: string;
  onEmailChange?: (email: string) => void;
  onEmailSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

function formatTripDates(days: ItineraryDay[]) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const first = formatter.format(new Date(`${days[0].date}T00:00:00Z`));
  const last = formatter.format(new Date(`${days.at(-1)!.date}T00:00:00Z`));
  return first === last ? first : `${first} - ${last}`;
}

export function PlanResultLayout(props: PlanResultLayoutProps) {
  const {
    result, itineraryDays, planId, activeDayIndex, onDayChange, onSwap, shareUrl, expiresAt,
    copyStatus, onCopyShareLink, onDownloadCalendar, calendarStatus, swapStatus, saveStatus,
    savingPlan, onSaveRetry, onEdit, tuneOptions, onTune, loading, email, savingEmail,
    emailMessage, onEmailChange, onEmailSubmit,
  } = props;
  const lodging = result.tripSummary?.lodging || "Not specified";
  const spend = result.tripSummary?.estimatedSpend || "Estimate unavailable";
  const dayCount = itineraryDays.length;

  return (
    <div className="-mx-4 mt-5 bg-[#f6f4f7] px-4 py-6 text-zinc-950 sm:mx-auto sm:rounded-lg sm:border sm:border-zinc-200 sm:p-6 sm:shadow-xl">
      <header>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-800">Your personalized Vegas plan</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-zinc-950 sm:text-4xl lg:text-5xl">
              {dayCount > 1 ? `Your ${dayCount}-day Vegas game plan` : "Your Vegas game plan"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 sm:text-base">
              {/* Only claim an anchor the itinerary actually contains. Without a
                  confirmed showtime the pick is a suggestion, not the spine. */}
              {result.bestPickScheduled ? (
                <>Built around <strong className="text-zinc-900">{result.bestPickName}</strong>. </>
              ) : (
                <>The evenings are left open on purpose. </>
              )}
              {result.whyItFits}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onEdit ? (
              <button type="button" onClick={onEdit} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-950 hover:bg-zinc-100 sm:flex-none">
                <Pencil className="h-4 w-4" /> Edit trip
              </button>
            ) : (
              <Link href="/planner?refine=1" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-950 hover:bg-zinc-100 sm:flex-none">
                <Pencil className="h-4 w-4" /> Edit trip
              </Link>
            )}
            {shareUrl ? (
              <button type="button" onClick={onCopyShareLink} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 text-sm font-black text-zinc-950 hover:bg-amber-200 sm:flex-none">
                {copyStatus === "Copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copyStatus || "Share plan"}
              </button>
            ) : onSaveRetry ? (
              <button type="button" onClick={onSaveRetry} disabled={savingPlan} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-amber-300 px-4 text-sm font-black text-zinc-950 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70 sm:flex-none">
                {savingPlan ? "Saving..." : "Save link"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          {[
            ["Dates", formatTripDates(itineraryDays)],
            ["Travelers", result.partySize ? `${result.partySize} ${result.partySize === 1 ? "traveler" : "travelers"}` : "Your group"],
            ["Staying", lodging],
            ["Estimated spend", spend],
          ].map(([label, value]) => (
            <div key={label} className="min-w-44 flex-1 border-r border-zinc-200 px-4 py-3 last:border-r-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
              <p className="mt-1 text-sm font-black text-zinc-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-xs font-black ${shareUrl ? "text-emerald-700" : "text-zinc-500"}`}>
            {shareUrl
              ? `Saved automatically. Private link${expiresAt ? ` available through ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(expiresAt))}` : " ready"}.`
              : saveStatus || "Creating a private return link for this plan."}
          </p>
          <div className="flex flex-wrap gap-2">
            <PrintPlanButton />
            <button type="button" onClick={onDownloadCalendar} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-950 hover:bg-zinc-100">
              <CalendarPlus className="h-4 w-4" /> Calendar
            </button>
          </div>
        </div>
        {swapStatus ? <p className="mt-2 text-xs font-bold text-fuchsia-800">{swapStatus}</p> : null}
        {calendarStatus ? <p className="mt-2 text-xs font-bold text-fuchsia-800">{calendarStatus}</p> : null}
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <PlanItineraryWorkspace itineraryDays={itineraryDays} activeDayIndex={activeDayIndex} onDayChange={onDayChange} onSwap={onSwap} />
        <aside className="space-y-4 lg:sticky lg:top-20">
          <PlanBookingChecklist planId={planId} itineraryDays={itineraryDays} estimatedSpend={spend} />
          <details data-testid="mobile-trip-details" className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <summary className="cursor-pointer list-none px-4 py-4 text-sm font-black text-zinc-950">
              <span className="flex items-center justify-between gap-3">Trip details and assumptions <span aria-hidden="true" className="text-fuchsia-800">+</span></span>
            </summary>
            <div className="border-t border-zinc-200 p-4"><PlanTripDetails result={result} /></div>
          </details>
        </aside>
      </div>

      {result.backupPickNames.length > 0 ? <p className="mt-5 text-sm text-zinc-500">Backup picks: <span className="font-bold text-zinc-700">{result.backupPickNames.join(" / ")}</span></p> : null}
      {tuneOptions.length > 0 && onTune ? (
        <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-black text-zinc-950">Tune this game plan</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tuneOptions.map((option) => (
              <button key={option.label} type="button" onClick={() => onTune(option.updates)} disabled={loading} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-zinc-100 px-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60">
                <RefreshCw className="h-3.5 w-3.5" /> {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {onEmailSubmit && onEmailChange ? (
        <form onSubmit={onEmailSubmit} className="mt-4 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-2 text-sm font-bold text-zinc-700">
            Save email for this plan
            <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="Email address" className="min-h-11 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-fuchsia-700" />
          </label>
          <button disabled={savingEmail} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white transition hover:bg-fuchsia-900 disabled:cursor-wait disabled:opacity-70">
            <Mail className="h-4 w-4" /> {savingEmail ? "Saving..." : "Attach email"}
          </button>
          {emailMessage ? <p className="text-sm font-bold text-fuchsia-800 sm:col-span-2">{emailMessage}</p> : null}
        </form>
      ) : null}
      <PrintableGeneratedPlan title={result.headline} days={itineraryDays} />
    </div>
  );
}
