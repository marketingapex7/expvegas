export type PlanningStop = {
  name: string;
  area: string;
  tags: string[];
  budget: "value" | "mid" | "premium";
  description: string;
};

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
