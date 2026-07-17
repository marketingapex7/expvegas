export type EventCategory = "shows" | "comedy" | "sports" | "concerts" | "attractions";

export type VegasEvent = {
  id: string;
  name: string;
  slug: string;
  category: EventCategory;
  subcategory?: string;
  venueName: string;
  area: string;
  priceMin?: number;
  priceMax?: number;
  ageRestriction?: string;
  runtimeMinutes?: number;
  startDateTime?: string;
  localDate?: string;
  localTime?: string;
  currency?: string;
  venueAddress?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  tags: string[];
  bestFor: string[];
  skipIf: string[];
  shortDescription: string;
  quickVerdict: string;
  affiliateUrl: string;
  imageUrl?: string;
  showtimes?: {
    id: string;
    localDate?: string;
    localTime?: string;
    startDateTime?: string;
    affiliateUrl: string;
  }[];
  editorialScore: number;
  valueScore: number;
  wowScore: number;
  familyScore: number;
  couplesScore: number;
  bachelorScore: number;
};
