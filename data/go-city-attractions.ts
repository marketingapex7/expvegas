import { GoCityPassType, goCityBookingUrl } from "@/lib/go-city";

export type GoCityAttraction = {
  name: string;
  area: string;
  retailValue: number;
  passTypes: GoCityPassType[];
  reservationRequired?: boolean;
  timing: "flexible" | "scheduled";
  durationMinutes: number;
  tags: string[];
  bookingUrl: string;
};

const allPasses: GoCityPassType[] = ["essentials", "explorer", "all-inclusive"];
const explorerAndAllInclusive: GoCityPassType[] = ["explorer", "all-inclusive"];
const allInclusive: GoCityPassType[] = ["all-inclusive"];

function attraction(
  name: string,
  area: string,
  retailValue: number,
  passTypes: GoCityPassType[],
  timing: GoCityAttraction["timing"],
  durationMinutes: number,
  tags: string[],
  reservationRequired = false,
): GoCityAttraction {
  return {
    name,
    area,
    retailValue,
    passTypes,
    reservationRequired,
    timing,
    durationMinutes,
    tags,
    bookingUrl: goCityBookingUrl(passTypes),
  };
}

// Curated from Go City's official Las Vegas catalog. Prices and inclusion can
// change, so the UI labels these as retail-value estimates and shows a checked date.
export const goCityAttractions: GoCityAttraction[] = [
  attraction("Strip Highlights Night Flight on Papillon Helicopters", "Off Strip", 124, allInclusive, "scheduled", 90, ["helicopter", "views", "premium", "couples"], true),
  attraction("KA by Cirque du Soleil", "MGM Grand", 137, allInclusive, "scheduled", 90, ["cirque", "show", "spectacle", "south strip"]),
  attraction("Mad Apple by Cirque du Soleil", "New York-New York", 101, allInclusive, "scheduled", 90, ["cirque", "show", "comedy", "south strip"]),
  attraction("Desert Icons: Valley of Fire or Red Rock Canyon Hike", "Off Strip", 129, allInclusive, "scheduled", 300, ["outdoors", "hiking", "day trip", "nature"], true),
  attraction("High Roller Observation Wheel: Daytime Ticket", "The LINQ Promenade", 31, allPasses, "flexible", 45, ["views", "family", "couples", "center strip"], true),
  attraction("Eiffel Tower Experience at Paris Las Vegas", "Paris Las Vegas", 35, allPasses, "flexible", 60, ["views", "landmark", "couples", "center strip"], true),
  attraction("Madame Tussauds Admission", "The Venetian", 29, allPasses, "flexible", 90, ["museum", "family", "indoor", "north strip"], true),
  attraction("The Big Apple Roller Coaster", "New York-New York", 25, allPasses, "flexible", 45, ["ride", "thrill", "family", "south strip"]),
  attraction("Single Ride on Any FlyOver Experience", "FlyOver Las Vegas", 40, allPasses, "flexible", 60, ["immersive", "ride", "family", "center strip"]),
  attraction("The Tower at the STRAT", "The STRAT", 37, allPasses, "flexible", 75, ["views", "landmark", "north strip"]),
  attraction("The Mob Museum", "Downtown", 38, allPasses, "flexible", 150, ["museum", "history", "downtown", "indoor"]),
  attraction("Sip & Savor at Favorite Bistro", "The LINQ Promenade", 25, allPasses, "flexible", 60, ["food", "casual", "center strip"]),
  attraction("The Neon Museum Day or Night Flex Ticket", "Downtown", 35, allPasses, "flexible", 90, ["museum", "history", "photo", "downtown"]),
  attraction("Hop-On Hop-Off Big Bus Classic Daytime Tour", "Las Vegas Boulevard", 58, explorerAndAllInclusive, "scheduled", 120, ["tour", "sightseeing", "first-timers"]),
  attraction("Big Bus Las Vegas Night Tour", "Las Vegas Boulevard", 59, explorerAndAllInclusive, "scheduled", 150, ["tour", "night", "sightseeing"], true),
  attraction("Fly LINQ Zipline", "The LINQ Promenade", 48, explorerAndAllInclusive, "scheduled", 60, ["thrill", "zipline", "center strip"], true),
  attraction("Downtown Fremont Street Walking Tour", "Downtown", 37, explorerAndAllInclusive, "scheduled", 120, ["tour", "history", "downtown"], true),
  attraction("Sweet Sin Bakery & Cafe at the LINQ Promenade", "The LINQ Promenade", 20, explorerAndAllInclusive, "flexible", 45, ["food", "dessert", "center strip"]),
  attraction("In the Game Fremont Street - Freakshow Arcade & Bar", "Downtown", 37, explorerAndAllInclusive, "flexible", 75, ["arcade", "bar", "downtown", "friends"]),
  attraction("The Australian Bee Gees Show", "Excalibur", 48, explorerAndAllInclusive, "scheduled", 90, ["show", "music", "south strip"]),
  attraction("Discovering King Tut's Tomb at the Luxor", "Luxor", 39, explorerAndAllInclusive, "flexible", 75, ["museum", "history", "family", "south strip"]),
  attraction("WOW - The Vegas Spectacular", "Rio Las Vegas", 67, explorerAndAllInclusive, "scheduled", 90, ["show", "spectacle", "off strip"]),
  attraction("ROUGE - The Sexiest Show in Vegas", "The STRAT", 50, explorerAndAllInclusive, "scheduled", 90, ["show", "adults", "north strip"]),
  attraction("Real Bodies at Horseshoe Las Vegas", "Horseshoe Las Vegas", 35, explorerAndAllInclusive, "flexible", 90, ["museum", "science", "indoor", "center strip"]),
  attraction("Ultimate 4D Experience All Day Pass at Excalibur", "Excalibur", 25, explorerAndAllInclusive, "flexible", 60, ["movies", "family", "south strip"]),
  attraction("MAX Flight 360 Simulator", "MGM Grand", 25, explorerAndAllInclusive, "flexible", 45, ["simulator", "thrill", "south strip"]),
  attraction("The Punk Rock Museum", "Downtown", 50, explorerAndAllInclusive, "flexible", 120, ["museum", "music", "downtown"]),
  attraction("Nathan Burton Magic Show", "FlyOver Las Vegas", 32, explorerAndAllInclusive, "scheduled", 75, ["magic", "show", "family", "center strip"]),
  attraction("Hoover Dam Highlights Tour", "Off Strip", 65, explorerAndAllInclusive, "scheduled", 300, ["tour", "day trip", "history"], true),
  attraction("GoCar Tour of the Las Vegas Strip", "Center Strip", 72, explorerAndAllInclusive, "scheduled", 120, ["tour", "driving", "sightseeing"], true),
  attraction("Escape IT: The Sewers", "Off Strip", 60, explorerAndAllInclusive, "scheduled", 90, ["escape room", "horror", "friends"], true),
  attraction("The Official SAW Escape Room", "Off Strip", 60, explorerAndAllInclusive, "scheduled", 90, ["escape room", "horror", "friends"], true),
  attraction("Escape Blair Witch", "Off Strip", 60, explorerAndAllInclusive, "scheduled", 90, ["escape room", "horror", "friends"], true),
  attraction("Number One Escape Room", "Off Strip", 45, explorerAndAllInclusive, "scheduled", 75, ["escape room", "friends", "indoor"], true),
  attraction("Professional Photo at the Welcome to Las Vegas Sign", "South Strip", 125, explorerAndAllInclusive, "scheduled", 45, ["photo", "landmark", "south strip"], true),
  attraction("minus5 Ice Experience at Mandalay Bay", "Mandalay Bay", 26, explorerAndAllInclusive, "flexible", 60, ["bar", "immersive", "south strip"]),
  attraction("Rockstar Nightclub Tour", "Center Strip", 99, explorerAndAllInclusive, "scheduled", 240, ["nightlife", "clubs", "friends"], true),
  attraction("Piano Man", "Planet Hollywood", 75, explorerAndAllInclusive, "scheduled", 90, ["show", "music", "center strip"]),
  attraction("Princess Diana & The Royals: The Exhibition", "The Shops at Crystals", 37, explorerAndAllInclusive, "flexible", 90, ["museum", "exhibition", "center strip"]),
  attraction("Las Vegas Bar Crawl", "Downtown", 70, explorerAndAllInclusive, "scheduled", 180, ["nightlife", "bar", "downtown"], true),
  attraction("Hollywood Cars Museum & Liberace Garage", "Off Strip", 20, explorerAndAllInclusive, "flexible", 90, ["museum", "cars", "indoor"]),
  attraction("Erotic Heritage Museum", "North Strip", 32, explorerAndAllInclusive, "flexible", 90, ["museum", "adults", "north strip"]),
  attraction("Las Vegas Science & Natural History Museum", "Downtown", 14, explorerAndAllInclusive, "flexible", 120, ["museum", "science", "family", "downtown"]),
  attraction("Rockstar Pool Party Club Tour", "Center Strip", 99, explorerAndAllInclusive, "scheduled", 240, ["pool", "nightlife", "friends"], true),
  attraction("Dinosaur Outpost at Town Square", "Town Square", 27, explorerAndAllInclusive, "flexible", 90, ["family", "kids", "south strip"]),
  attraction("Las Vegas Mini Grand Prix", "Off Strip", 35, explorerAndAllInclusive, "flexible", 120, ["family", "rides", "go karts"]),
  attraction("minus5 Ice Experience at Venetian Canal Shoppes", "The Venetian", 26, explorerAndAllInclusive, "flexible", 60, ["bar", "immersive", "north strip"]),
  attraction("Bellagio Gallery of Fine Art", "Bellagio", 29, explorerAndAllInclusive, "flexible", 75, ["art", "gallery", "center strip"]),
];

export const goCityFlexibleAttractions = goCityAttractions.filter((item) => item.timing === "flexible");
