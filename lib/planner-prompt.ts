/**
 * Pure helpers behind the trip-builder form. They translate chip selections and
 * date fields into the prompt sentence and the payload the planner API reads.
 *
 * These lived inside HeroPlanner, which made them unreachable from tests even
 * though they decide what the planner is asked to build. Nothing here touches
 * React or the DOM.
 */

const VEGAS_TIME_ZONE = "America/Los_Angeles";

export function formatTravelDate(value: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function addDays(value: string, days: number) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function tripLengthInDays(arrival: string, departure: string) {
  if (!arrival || !departure) return 0;
  return Math.round((Date.parse(`${departure}T00:00:00Z`) - Date.parse(`${arrival}T00:00:00Z`)) / 86_400_000);
}

export function currentVegasDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VEGAS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function sentenceFor(group: string, option: string) {
  if (group === "Ticket budget") return `Ticket budget: ${option}.`;
  if (group === "Group") return `Group: ${option}.`;
  if (group === "Lodging") {
    return option.includes("haven't booked") ? "Lodging: not booked yet." : `Lodging: near ${option}.`;
  }
  return `Vibe: ${option}.`;
}

export function mixedSelectionText(kind: "ticket" | "meal" | "gambling", values: string[]) {
  if (values.length === 0) return undefined;
  if (kind === "gambling" && values.length === 1 && values[0] === "No gambling") return "No gambling";
  if (kind === "gambling" && values.length === 1 && values[0] === "Casino atmosphere only") {
    return "Casino atmosphere only, with no gambling bankroll";
  }

  const label = kind === "ticket" ? "ticket options" : kind === "meal" ? "meals" : "gambling preferences";
  return `Mix ${label} across ${values.join(" and ")}; include choices from each selection when available`;
}

/**
 * Replaces an existing "Label: ..." sentence in the prompt, or appends it. The
 * prompt stays editable free text, so each chip owns one sentence rather than
 * the form rewriting whatever the visitor typed.
 */
export function upsertPromptSentence(current: string, label: string, sentence: string) {
  const trimmed = current.trim();
  const pattern = new RegExp(`${label}: [^.]*\\.`);

  if (pattern.test(trimmed)) {
    return trimmed.replace(pattern, sentence).replace(/\s{2,}/g, " ").trim();
  }

  if (!sentence) return trimmed;
  return trimmed.length > 0 ? `${trimmed} ${sentence}` : sentence;
}

export function travelDatesValue(arrivalDate: string, departureDate: string) {
  return arrivalDate && departureDate ? `${arrivalDate} to ${departureDate}` : arrivalDate || departureDate;
}

export function arrivalDateError(arrivalDate: string, today: string) {
  if (!arrivalDate) return "Choose your arrival date.";
  if (arrivalDate < today) return "Arrival must be today or later so we can use current schedules.";
  return "";
}

export function departureDateError(arrivalDate: string, departureDate: string) {
  if (!departureDate) return "Choose your departure date.";
  if (arrivalDate && departureDate < arrivalDate) return "Departure must be on or after arrival.";
  if (tripLengthInDays(arrivalDate, departureDate) > 7) return "Departure must be within 7 planning days of arrival.";
  return "";
}

/**
 * The blocking message shown when a build is attempted with unusable dates.
 * Empty means the dates are good enough to build on.
 */
export function travelDateBlocker(arrivalDate: string, departureDate: string, today: string) {
  if (arrivalDateError(arrivalDate, today) || departureDateError(arrivalDate, departureDate)) {
    if (!arrivalDate || !departureDate) {
      return "Choose arrival and departure dates first so we can use real Vegas schedules.";
    }
  }
  if (arrivalDate < today) return "Choose an arrival date from today forward so we can use current schedules.";
  if (departureDate < arrivalDate) return "Your departure date must be on or after your arrival date.";
  if (tripLengthInDays(arrivalDate, departureDate) > 7) return "Choose a trip of 7 planning days or fewer.";
  return "";
}

/** The inline message shown while the visitor is still editing the date fields. */
export function travelDateEditMessage(arrivalDate: string, departureDate: string, today: string) {
  if (arrivalDate && departureDate && departureDate < arrivalDate) {
    return "Your departure date must be on or after your arrival date.";
  }
  if (tripLengthInDays(arrivalDate, departureDate) > 7) return "Choose a trip of 7 planning days or fewer.";
  if (arrivalDate && arrivalDate < today) {
    return "Choose an arrival date from today forward so we can use current schedules.";
  }
  return "";
}
