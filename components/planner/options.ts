import { CalendarDays, MapPin, Sparkles, Users, WalletCards } from "lucide-react";

/**
 * The trip-builder's chip vocabulary. These labels are not display-only: they
 * are persisted with a saved plan and parsed by lib/planner-preferences, so
 * changing one changes what the engine is told. Add or rename a label only
 * alongside the parser that reads it.
 */

export const tuneOptions = [
  { label: "Make cheaper", updates: { mealBudget: "Mostly casual meals under $40 per person", budget: "event tickets under $100 per person" } },
  { label: "More premium", updates: { mealBudget: "One premium dinner over $100 per person", budget: "premium event tickets are okay if worth it" } },
  { label: "Less walking", updates: { logistics: "Keep it walkable" } },
  { label: "More food-focused", updates: { mealBudget: "Food is a big part at $80-$150 per person" } },
  { label: "More gambling", updates: { gamblingPreference: "Table games bankroll $300+ total" } },
  { label: "No gambling", updates: { gamblingPreference: "No gambling" } },
  { label: "Family-friendly", updates: { pace: "Family-friendly pace", groupType: "family with teens" } },
];

export const refinementGroups = [
  {
    label: "Food",
    key: "foodPreference",
    multi: true,
    options: ["Steakhouse", "Buffet", "Celebrity chef", "Casual and fast", "Italian", "Asian", "Mexican", "Cheap eats", "Surprise me"],
  },
  {
    label: "Food spend",
    key: "mealBudget",
    multi: true,
    options: ["Under $30 per person", "$30-$60 per person", "$60-$120 per person", "$120+ splurge meal"],
  },
  {
    label: "Gambling bankroll",
    key: "gamblingPreference",
    multi: true,
    options: ["No gambling", "Casino atmosphere only", "Bankroll under $100", "Bankroll $100-$300", "Bankroll $300-$750", "Bankroll $750+", "Slots", "Table games", "Poker", "Sportsbook"],
  },
  {
    label: "Pace",
    key: "pace",
    multi: false,
    options: ["Packed schedule", "Balanced", "Slow mornings", "Late nights", "Family-friendly pace"],
  },
  {
    label: "Logistics",
    key: "logistics",
    multi: false,
    options: ["Keep it walkable", "Rideshares are fine", "Stay near hotel", "Avoid long lines"],
  },
] as const;

export const helperGroups = [
  {
    label: "Ticket budget",
    icon: WalletCards,
    multi: true,
    options: ["Under $100 per person", "$100-$200 per person", "$200-$350 per person", "$350+ splurge"],
  },
  {
    label: "Group",
    icon: Users,
    multi: false,
    options: ["couple", "friends trip", "family with teens", "bachelor party"],
  },
  {
    label: "Lodging",
    icon: MapPin,
    multi: false,
    options: ["haven't booked lodging yet", "center Strip", "near Bellagio", "near Caesars", "near Sphere", "near T-Mobile Arena", "Downtown"],
  },
  {
    label: "Vibe",
    icon: Sparkles,
    multi: false,
    options: ["big Vegas spectacle", "easy laughs", "sports energy", "not too touristy"],
  },
];

export const dateStepIcon = CalendarDays;

export const starterPrompt =
  "We want a memorable Vegas night with one strong anchor, easy logistics, and something that feels worth booking.";

/** Labels shown while a plan builds. The count paces the progress indicator. */
export const buildSteps = [
  "Reading trip basics",
  "Checking live event inventory",
  "Scoring restaurants and free stops",
  "Balancing timing, buffers, and walking",
  "Running itinerary sanity check",
  "Saving your game plan",
];

/**
 * Gambling answers that describe abstaining. Selecting one clears any bankroll
 * choices, since "No gambling" plus "Poker" is not a coherent instruction.
 */
export const exclusiveGamblingOptions = ["No gambling", "Casino atmosphere only"];
