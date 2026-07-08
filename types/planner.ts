export type PlannerInput = {
  travelDates?: string;
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
  estimatedSpend: string;
  bookNow: string[];
  keepFlexible: string[];
  whyThisPlanWorks: string;
};

export type PlannerResponse = PlannerOutput & {
  bestPickName: string;
  backupPickNames: string[];
  sourceSummary?: string;
  itineraryDays?: ItineraryDay[];
  tripSummary?: TripSummary;
};
