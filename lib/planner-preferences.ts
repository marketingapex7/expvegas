import { PlannerInput } from "@/types/planner";
import {
  MealPriceLevel,
  mealLevelsFromText,
  TicketBudgetBand,
  ticketBandsFromText,
} from "@/lib/budget-preferences";

/**
 * Planner answers arrive as display strings ("Casino atmosphere only", "$350+
 * splurge"), because that is what the chips in HeroPlanner emit and what gets
 * persisted with a saved plan. The engine used to concatenate every field into
 * one lowercase blob and ask `text.includes(...)` of it, which let any field
 * trigger a flag meant for another one:
 *
 *   - "Casino atmosphere only" contains "atmo(sphere)", so wanting casino
 *     ambience produced Sphere lodging advice
 *   - "Sportsbook" contains "sports", so a gambling answer produced arena
 *     lodging advice
 *   - "Under $100 per person" contains "under", which once set the free-focus
 *     flag and deleted the paid attraction from every day
 *
 * This module is the single boundary where those strings become typed values.
 * Every parser below reads exactly one field, or the free-text fields the
 * visitor actually typed into, so a label can no longer leak sideways.
 */

export type GroupKind = "couple" | "friends" | "family" | "bachelor" | "unspecified";
export type GamblingStance = "none" | "atmosphere-only" | "plays" | "unspecified";
export type BudgetTier = "value" | "mid" | "premium";

export type PlannerPreferences = {
  group: GroupKind;
  isFamily: boolean;
  slowMornings: boolean;
  packedSchedule: boolean;
  gambling: GamblingStance;
  avoidsGambling: boolean;
  lodgingIsFlexible: boolean;
  /**
   * Normalized stay area used for proximity scoring, empty when lodging is
   * still flexible: an unbooked area must not pull stops toward itself.
   */
  stayArea: string;
  /**
   * The stay-area answer as given, kept even when lodging is flexible. Someone
   * who picked "near Sphere" but has not booked has still told us where they
   * are leaning, and the lodging recommendation should honor that.
   */
  lodgingText: string;
  ticketBands: TicketBudgetBand[];
  mealLevels: MealPriceLevel[];
  budgetTier: BudgetTier;
  /** Lowercased prompt + vibe + additional details: what the visitor typed. */
  intentText: string;
  freeFocus: boolean;
  shoppingFocus: boolean;
  daytimeAnchor: boolean;
  wantsAdultBrunch: boolean;
  /**
   * Text used for tag and cuisine affinity scoring. Carries the qualitative
   * fields only. Ticket budget, meal budget, gambling, and pace are excluded:
   * their labels are money amounts and game names that collide with stop tags
   * without ever describing one.
   */
  affinityText: string;
  blobForProbe: string;
};

const FREE_FOCUS_PATTERN = /\b(free|cheap|no[- ]tickets?|budget[- ]friendly|on a budget|low[- ]cost)\b/;

// "Flexible daytime stops" describes free daytime filler, not a daytime
// headliner. Only an explicit daytime-event intent lowers the anchor floor
// below the evening hours.
const DAYTIME_ANCHOR_PATTERN = /\b(day ?club|day ?party|pool party|brunch|matinee|(daytime|afternoon) (show|event|party|headliner))\b/;

const SHOPPING_PATTERN = /\b(shop|shops|shopping|mall|boutique|outlets?)\b/;

const ADULT_BRUNCH_PATTERN = /\b(drag|brunch|lgbtq?)\b/;

const NOT_BOOKED_PATTERN = /\b(not booked|have ?n'?t booked|no lodging|undecided)\b/;

function lower(value?: string) {
  return (value || "").toLowerCase();
}

export function groupKindFrom(groupType?: string): GroupKind {
  const value = lower(groupType);
  // Checked before "couple" and "friends" so "bachelorette party with friends"
  // still scores as a bachelor(ette) group.
  if (value.includes("bachelor")) return "bachelor";
  if (value.includes("family")) return "family";
  if (value.includes("couple")) return "couple";
  if (value.includes("friend")) return "friends";
  return "unspecified";
}

function gamblingStanceFrom(gamblingPreference: string, intentText: string): GamblingStance {
  const value = lower(gamblingPreference);
  // A visitor can decline gambling either by picking the chip or by typing it.
  if (value.includes("no gambling") || /\bno gambling\b/.test(intentText)) return "none";
  if (value.includes("atmosphere")) return "atmosphere-only";
  return value.trim() ? "plays" : "unspecified";
}

function budgetTierFrom(ticketBands: TicketBudgetBand[], intentText: string): BudgetTier {
  // The ticket-budget chip is a quantitative band, so parse it as one rather
  // than keyword-matching its label. A mixed selection maps to its highest
  // band: the visitor has said they will pay that much for the right pick.
  if (ticketBands.length > 0) {
    if (ticketBands.includes("350-plus") || ticketBands.includes("200-350")) return "premium";
    if (ticketBands.includes("100-200")) return "mid";
    return "value";
  }

  if (FREE_FOCUS_PATTERN.test(intentText) || intentText.includes("value")) return "value";
  if (/\b(premium|splurge|worth it)\b/.test(intentText)) return "premium";
  return "mid";
}

function stayAreaFrom(stayingNear: string, flexible: boolean) {
  if (!stayingNear || flexible) return "";
  return lower(stayingNear).replace("near ", "").replace(" / ", " ");
}

export function readPreferences(input: PlannerInput): PlannerPreferences {
  const intentText = `${lower(input.prompt)} ${lower(input.vibe)} ${lower(input.additionalDetails)}`.trim();
  const paceText = lower(input.pace);
  const stayingNear = input.stayingNear || "";
  const lodgingIsFlexible =
    !stayingNear || NOT_BOOKED_PATTERN.test(lower(stayingNear)) || NOT_BOOKED_PATTERN.test(intentText);
  const ticketBands = ticketBandsFromText(input.budget);
  const group = groupKindFrom(input.groupType);
  const gambling = gamblingStanceFrom(input.gamblingPreference || "", intentText);

  return {
    group,
    isFamily: group === "family",
    // Pace is expressed either through the chip or in free text, and nowhere else.
    slowMornings: paceText.includes("slow morning") || intentText.includes("slow morning"),
    packedSchedule: paceText.includes("packed") || intentText.includes("packed"),
    gambling,
    avoidsGambling: gambling === "none",
    lodgingIsFlexible,
    stayArea: stayAreaFrom(stayingNear, lodgingIsFlexible),
    lodgingText: lower(stayingNear),
    ticketBands,
    mealLevels: mealLevelsFromText(input.mealBudget),
    budgetTier: budgetTierFrom(ticketBands, intentText),
    intentText,
    freeFocus: FREE_FOCUS_PATTERN.test(intentText),
    shoppingFocus: SHOPPING_PATTERN.test(intentText),
    daytimeAnchor: DAYTIME_ANCHOR_PATTERN.test(intentText),
    wantsAdultBrunch: ADULT_BRUNCH_PATTERN.test(intentText),
    blobForProbe: `${lower(input.gamblingPreference)} ${paceText}`,
    affinityText: [
      intentText,
      lower(input.groupType),
      lower(input.foodPreference),
      lower(input.logistics),
      lower(stayingNear),
    ]
      .filter(Boolean)
      .join(" "),
  };
}
