export type DirectoryCategory = "hotel" | "restaurant" | "attraction" | "free" | "shopping" | "event";

export type DirectoryListing = {
  id: string;
  slug: string;
  name: string;
  category: DirectoryCategory;
  area: string;
  venue?: string;
  description: string;
  priceLabel: string;
  bestFor: string[];
  tags: string[];
  bookingUrl?: string;
  bookingLabel?: string;
  durationLabel?: string;
  editorialScore: number;
};

export type TripPick = Pick<DirectoryListing, "id" | "slug" | "name" | "category" | "area" | "description"> & {
  detailUrl: string;
};
