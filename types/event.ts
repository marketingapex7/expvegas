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
  tags: string[];
  bestFor: string[];
  skipIf: string[];
  shortDescription: string;
  quickVerdict: string;
  affiliateUrl: string;
  imageUrl?: string;
  editorialScore: number;
  valueScore: number;
  wowScore: number;
  familyScore: number;
  couplesScore: number;
  bachelorScore: number;
};
