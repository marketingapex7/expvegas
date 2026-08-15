export type PlannerInput = {
  travelDates?: string;
  partySize?: number;
  prompt?: string;
  groupType?: string;
  budget?: string;
  vibe?: string;
  stayingNear?: string;
  dealbreakers?: string;
  foodPreference?: string;
  mealBudget?: string;
  gamblingPreference?: string;
  pace?: string;
  logistics?: string;
  additionalDetails?: string;
};

export type PlannerOutput = {
  headline: string;
  bestPickId: string;
  whyItFits: string;
  timeline: { time: string; title: string; description?: string }[];
  backupPickIds: string[];
  cheaperVersion?: string;
  premiumVersion?: string;
  avoid?: string[];
};

export type ItineraryBlock = {
  time: string;
  title: string;
  category: "meal" | "event" | "attraction" | "casino" | "shopping" | "transit" | "free";
  location?: string;
  description?: string;
  bookingUrl?: string;
  priceHint?: string;
  durationMinutes?: number;
  timingNote?: string;
  /**
   * Earliest minute-of-day this block may be moved to. Used to stop the
   * scheduler from pulling a protected block (such as arrival and check-in)
   * earlier than is realistic when it makes room for a fixed event start.
   */
  earliestStartMinutes?: number;
  /**
   * Latest credible start for a time-sensitive block such as a meal service.
   * The sanitizer drops the block instead of publishing a closed-venue time.
   */
  latestStartMinutes?: number;
  provider?: "go-city";
  passTypes?: import("@/lib/go-city").GoCityPassType[];
  providerBookingUrl?: string;
  reservationRequired?: boolean;
};

export type ItineraryDay = {
  date: string;
  label: string;
  theme: string;
  blocks: ItineraryBlock[];
};

export type TripSummary = {
  lodging: string;
  bestLodgingZone?: string;
  tripStyle: string[];
  assumptions?: string[];
  estimatedSpend: string;
  bookNow: string[];
  keepFlexible: string[];
  whyThisPlanWorks: string;
};

export type PlannerEventOption = {
  id: string;
  name: string;
  category: "shows" | "comedy" | "sports" | "concerts" | "attractions";
  venueName: string;
  quickVerdict: string;
  affiliateUrl?: string;
  priceMin?: number;
  priceMax?: number;
  runtimeMinutes?: number;
  localDate?: string;
  localTime?: string;
};

export type PlannerResponse = PlannerOutput & {
  bestPickName: string;
  /**
   * True only when the best pick is actually placed in the timed itinerary.
   * When no provider showtime is confirmed the pick stays a recommendation, and
   * the plan must not describe itself as built around it.
   */
  bestPickScheduled?: boolean;
  backupPickNames: string[];
  partySize?: number;
  sourceSummary?: string;
  eventOptions?: PlannerEventOption[];
  itineraryDays?: ItineraryDay[];
  tripSummary?: TripSummary;
};
