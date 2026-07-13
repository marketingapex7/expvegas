export type VegasHotel = {
  name: string;
  slug: string;
  area: string;
  priceLevel: "value" | "mid" | "premium";
  bestFor: string[];
  tags: string[];
  bookingUrl: string;
  editorialScore: number;
  description: string;
};

export const hotels: VegasHotel[] = [
  {
    name: "Bellagio",
    slug: "bellagio-las-vegas",
    area: "Center Strip",
    priceLevel: "premium",
    bestFor: ["first trips", "couples", "classic Vegas"],
    tags: ["fountains", "fine dining", "center strip", "luxury"],
    bookingUrl: "https://bellagio.mgmresorts.com/en.html",
    editorialScore: 95,
    description: "A polished center-Strip anchor for visitors who want iconic Vegas sights, strong dining, and easy access to neighboring resorts.",
  },
  {
    name: "The Venetian Resort",
    slug: "venetian-resort-las-vegas",
    area: "North-Center Strip",
    priceLevel: "premium",
    bestFor: ["couples", "Sphere trips", "food-focused stays"],
    tags: ["sphere", "shopping", "restaurants", "suites"],
    bookingUrl: "https://www.venetianlasvegas.com/",
    editorialScore: 94,
    description: "A suite-focused resort that works especially well for Sphere plans, restaurant-heavy trips, and visitors who want plenty inside one complex.",
  },
  {
    name: "Park MGM",
    slug: "park-mgm-las-vegas",
    area: "South-Center Strip",
    priceLevel: "mid",
    bestFor: ["concert trips", "sports weekends", "walkable plans"],
    tags: ["t-mobile arena", "dolby live", "eataly", "smoke free"],
    bookingUrl: "https://parkmgm.mgmresorts.com/en.html",
    editorialScore: 91,
    description: "A practical event-weekend base beside T-Mobile Arena and Dolby Live, with straightforward access to ARIA and New York-New York.",
  },
  {
    name: "Wynn Las Vegas",
    slug: "wynn-las-vegas",
    area: "North Strip",
    priceLevel: "premium",
    bestFor: ["luxury trips", "couples", "premium dining"],
    tags: ["luxury", "restaurants", "golf", "north strip"],
    bookingUrl: "https://www.wynnlasvegas.com/",
    editorialScore: 96,
    description: "A high-service resort for travelers who want the hotel, pool, dining, and nightlife to be major parts of the experience.",
  },
  {
    name: "Circa Resort & Casino",
    slug: "circa-resort-las-vegas",
    area: "Downtown",
    priceLevel: "mid",
    bestFor: ["sports fans", "adults-only trips", "Downtown stays"],
    tags: ["downtown", "sportsbook", "stadium swim", "adults only"],
    bookingUrl: "https://www.circalasvegas.com/",
    editorialScore: 90,
    description: "A modern Downtown base with a major sportsbook and pool scene, best for adults who want Fremont energy instead of a Strip-centered trip.",
  },
  {
    name: "Mandalay Bay",
    slug: "mandalay-bay-las-vegas",
    area: "South Strip",
    priceLevel: "mid",
    bestFor: ["families", "Raiders weekends", "pool-focused trips"],
    tags: ["allegiant stadium", "pool", "family", "south strip"],
    bookingUrl: "https://mandalaybay.mgmresorts.com/en.html",
    editorialScore: 88,
    description: "A south-Strip resort with a substantial pool complex and useful access for Allegiant Stadium events and family-oriented stays.",
  },
];
