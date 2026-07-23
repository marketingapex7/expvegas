export type DirectoryCategory = "hotel" | "restaurant" | "attraction" | "free" | "shopping" | "event";
export type BookingGuidance = "book-now" | "reserve" | "flexible" | "free" | "check-availability";
export type CostUnit = "per-person" | "per-night" | "free" | "variable";
export type TripPickStatus = "considering" | "must-do" | "booked" | "backup";
export type VegasZone = "South Strip" | "Center Strip" | "North Strip" | "Downtown" | "Off Strip";
export type EnvironmentType = "Indoor" | "Outdoor" | "Mixed";

export type DirectoryListing = {
  id: string;
  slug: string;
  name: string;
  category: DirectoryCategory;
  area: string;
  venue?: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  priceLabel: string;
  bestFor: string[];
  tags: string[];
  bookingUrl?: string;
  bookingLabel?: string;
  durationLabel?: string;
  planningTip: string;
  highlights: string[];
  estimatedCostMin: number;
  estimatedCostMax: number;
  costUnit: CostUnit;
  bookingGuidance: BookingGuidance;
  bookingAdvice: string;
  planningRole: string;
  zone: VegasZone;
  environment: EnvironmentType;
  idealTime: string;
  durationMinMinutes: number;
  durationMaxMinutes: number;
  skipIf: string[];
  lastVerified: string;
  mapUrl: string;
  editorialScore: number;
};

export type TripPick = Pick<DirectoryListing, "id" | "slug" | "name" | "category" | "area" | "description" | "imageUrl" | "priceLabel" | "durationLabel"> & {
  detailUrl: string;
  zone?: VegasZone;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  costUnit?: CostUnit;
  bookingGuidance?: BookingGuidance;
  mapUrl?: string;
  status?: TripPickStatus;
  locked?: boolean;
};

export type TripDates = {
  arrivalDate: string;
  departureDate: string;
};

export type TripSettings = {
  partySize: number;
  budgetCap: number;
};
