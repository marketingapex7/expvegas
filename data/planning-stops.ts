export type PlanningStop = {
  name: string;
  area: string;
  tags: string[];
  budget: "value" | "mid" | "premium";
  description: string;
};

export const freeExperienceStops: PlanningStop[] = [
  {
    name: "Bellagio Fountain show and Conservatory walk",
    area: "Bellagio",
    tags: ["free", "classic", "couple", "family", "first-timers", "bellagio", "photo"],
    budget: "value",
    description: "A high-impact free Vegas moment that works before dinner, after dinner, or as a reset between bigger plans.",
  },
  {
    name: "Forum Shops window-shopping and Atlantis show",
    area: "Caesars Palace",
    tags: ["shopping", "free", "classic", "family", "caesars", "center strip"],
    budget: "value",
    description: "Easy indoor wandering with big Vegas mall energy, people-watching, and no ticket pressure.",
  },
  {
    name: "Grand Canal Shoppes and Venetian canals",
    area: "Venetian",
    tags: ["shopping", "free", "couple", "family", "sphere", "venetian", "photo"],
    budget: "value",
    description: "A polished, walkable stop that pairs well with Sphere, Venetian, Palazzo, and Wynn plans.",
  },
  {
    name: "LINQ Promenade walk",
    area: "The LINQ Promenade",
    tags: ["free", "casual", "friends", "family", "center strip", "cheap"],
    budget: "value",
    description: "Low-commitment Strip energy with quick bites, street atmosphere, and easy pivots.",
  },
  {
    name: "Wynn and Encore lobby garden walk",
    area: "Wynn",
    tags: ["free", "premium", "couple", "photo", "north strip", "luxury"],
    budget: "value",
    description: "A premium-feeling free stop for groups that want beautiful spaces without adding another paid attraction.",
  },
  {
    name: "Park MGM to Eataly stroll",
    area: "Park MGM",
    tags: ["free", "shopping", "sports", "concert", "t-mobile", "casual"],
    budget: "value",
    description: "A useful walkable bridge before arena events, Dolby Live shows, or dinner around the south Strip.",
  },
  {
    name: "Downtown Fremont Street wander",
    area: "Downtown",
    tags: ["free", "friends", "classic", "wild", "cheap", "not too touristy"],
    budget: "value",
    description: "Big free spectacle and casino-hopping energy, best when the group wants something looser than the Strip.",
  },
  {
    name: "ARIA and Cosmopolitan art-and-bar crawl",
    area: "ARIA / Cosmopolitan",
    tags: ["free", "couple", "friends", "cocktails", "center strip", "premium"],
    budget: "value",
    description: "A stylish, unticketed route through strong casino design, lobby art, and nearby lounges.",
  },
];

export const attractionStops: PlanningStop[] = [
  {
    name: "Bellagio Conservatory and Fountains",
    area: "Bellagio",
    tags: ["free", "couple", "family", "classic", "bellagio"],
    budget: "value",
    description: "Easy, photogenic Vegas stop that fits before dinner or after brunch.",
  },
  {
    name: "High Roller Observation Wheel",
    area: "The LINQ Promenade",
    tags: ["views", "family", "couple", "mid", "center strip"],
    budget: "mid",
    description: "Simple Strip-view attraction that is easy to schedule between meals and shows.",
  },
  {
    name: "Sphere exterior and Venetian walk",
    area: "Near Sphere",
    tags: ["sphere", "views", "free", "first-timers"],
    budget: "value",
    description: "A low-friction visual stop near Venetian and Sphere plans.",
  },
  {
    name: "AREA15",
    area: "Off Strip",
    tags: ["immersive", "friends", "family", "not too touristy"],
    budget: "mid",
    description: "Good afternoon option for groups that want something more immersive than a casino walk.",
  },
];

export const casinoStops: PlanningStop[] = [
  {
    name: "The Cosmopolitan casino floor",
    area: "The Cosmopolitan",
    tags: ["couple", "friends", "center strip", "cocktails"],
    budget: "mid",
    description: "Stylish casino energy with strong nearby bars and restaurants.",
  },
  {
    name: "Park MGM / NoMad casino",
    area: "Park MGM",
    tags: ["south strip", "date", "sports", "concert"],
    budget: "mid",
    description: "Convenient gambling stop before or after T-Mobile Arena, Dolby Live, or ARIA plans.",
  },
  {
    name: "Caesars Palace casino",
    area: "Caesars Palace",
    tags: ["classic", "first-timers", "center strip", "bachelor"],
    budget: "premium",
    description: "Big classic Vegas casino energy near Absinthe, the Forum Shops, and the Colosseum.",
  },
  {
    name: "Ellis Island",
    area: "East of Strip",
    tags: ["value", "casual", "friends", "low budget"],
    budget: "value",
    description: "Lower-key gambling and food stop when the group wants value over spectacle.",
  },
];
