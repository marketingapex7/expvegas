export type IntentPageContent = {
  title: string;
  description: string;
  intro: string;
  tips: string[];
  eventSlugs: string[];
};

export const bestIntentPages: Record<string, IntentPageContent> = {
  "bachelor-party": {
    title: "Best Vegas Experiences for a Bachelor Party",
    description: "High-energy Vegas shows, sports, attractions, and group-friendly plans for a bachelor weekend without wasting half the trip in transit.",
    intro: "The strongest bachelor-party plan has one anchor event, a flexible meal, and enough room for the group to change pace. Prioritize tickets that everyone agrees on, then keep the surrounding stops easy to reach.",
    tips: [
      "Choose the main event before collecting money from the group.",
      "Leave at least 90 minutes between dinner and a ticketed event.",
      "Keep one part of the night optional for people with different budgets.",
    ],
    eventSlugs: ["absinthe-las-vegas", "golden-knights-home-game", "sphere-experience", "comedy-cellar-las-vegas"],
  },
  "bachelorette-party": {
    title: "Best Vegas Experiences for a Bachelorette Party",
    description: "Compare polished, funny, photogenic, and group-friendly Vegas experiences for a bachelorette weekend.",
    intro: "A bachelorette itinerary works best when the headline plan feels special but the logistics stay simple. Build around one memorable show or attraction and avoid stacking reservations so tightly that the group spends the night checking the clock.",
    tips: [
      "Confirm age restrictions and seating rules before booking for the group.",
      "Pick dinner and the main event in the same part of the Strip.",
      "Use refundable reservations where possible while the headcount settles.",
    ],
    eventSlugs: ["absinthe-las-vegas", "o-cirque-du-soleil", "high-roller-observation-wheel", "sphere-experience"],
  },
  "after-dinner": {
    title: "Best Things To Do in Vegas After Dinner",
    description: "Shortlist flexible Vegas shows, comedy, views, and attractions that fit naturally after dinner.",
    intro: "After-dinner plans should be close, easy to enter, and forgiving if the meal runs long. A 60-to-90-minute experience is usually easier than crossing the Strip for a tightly timed production.",
    tips: [
      "Allow 30 minutes to exit a restaurant and reach a nearby venue.",
      "Choose reserved seats only when the dinner timing is dependable.",
      "Keep a flexible attraction as the backup for a late-running meal.",
    ],
    eventSlugs: ["high-roller-observation-wheel", "comedy-cellar-las-vegas", "absinthe-las-vegas", "o-cirque-du-soleil"],
  },
  "people-who-dont-gamble": {
    title: "Best Vegas Experiences for People Who Do Not Gamble",
    description: "Build a complete Las Vegas trip around shows, food, views, sports, and attractions without making casino play the point.",
    intro: "Vegas is easy to enjoy without gambling when each day has one strong anchor and a few flexible places to explore. The best non-gambling plans mix a signature production with food, architecture, views, and neighborhood time.",
    tips: [
      "Treat casino resorts as dining and entertainment districts, not obligations to play.",
      "Mix paid anchors with free resort, art, and fountain walks.",
      "Group nearby stops together so transportation does not consume the day.",
    ],
    eventSlugs: ["o-cirque-du-soleil", "sphere-experience", "high-roller-observation-wheel", "comedy-cellar-las-vegas"],
  },
};

export const nearIntentPages: Record<string, IntentPageContent> = {
  sphere: {
    title: "Things To Do Near Sphere Las Vegas",
    description: "Plan shows, attractions, meals, and easy Strip stops around Sphere without adding unnecessary travel.",
    intro: "Sphere sits just east of the Strip near The Venetian and the LINQ corridor. Use the venue as the night's anchor, then favor nearby stops so pedestrian bridges, crowds, and event traffic do not derail the schedule.",
    tips: ["Arrive in the area early on concert nights.", "Allow extra time for the walk from Strip resorts.", "Book dinner before the event rush rather than immediately afterward."],
    eventSlugs: ["sphere-experience", "high-roller-observation-wheel", "absinthe-las-vegas", "o-cirque-du-soleil"],
  },
  "caesars-palace": {
    title: "Things To Do Near Caesars Palace",
    description: "Compare shows, views, comedy, and attractions near Caesars Palace and the center Strip.",
    intro: "Caesars Palace is a useful center-Strip anchor with direct access to Forum Shops and short routes toward Bellagio and the LINQ. Keep the night within this corridor when you want variety without relying on a car.",
    tips: ["Allow time to walk through the resort itself.", "Use pedestrian bridges instead of planning by map distance alone.", "Pair an early dinner with a nearby show or observation attraction."],
    eventSlugs: ["absinthe-las-vegas", "high-roller-observation-wheel", "o-cirque-du-soleil", "sphere-experience"],
  },
  bellagio: {
    title: "Things To Do Near Bellagio",
    description: "Build an easy center-Strip plan around Bellagio shows, free sights, and nearby attractions.",
    intro: "Bellagio works well for a polished center-Strip evening. The fountains and conservatory can fill flexible time, while nearby resorts make it possible to add dinner and a ticketed show without changing neighborhoods.",
    tips: ["Use the fountains as flexible buffer time, not a hard reservation.", "Expect longer walks inside resorts than the map suggests.", "Keep post-show plans flexible if you attend a full production."],
    eventSlugs: ["o-cirque-du-soleil", "absinthe-las-vegas", "high-roller-observation-wheel", "sphere-experience"],
  },
  "mgm-grand": {
    title: "Things To Do Near MGM Grand",
    description: "Find shows, sports, attractions, and practical night-out combinations near MGM Grand and the south Strip.",
    intro: "MGM Grand is a south-Strip base with straightforward access to T-Mobile Arena, New York-New York, Park MGM, and the Monorail. It is a good area for combining a main event with a casual meal and one flexible stop.",
    tips: ["Use the Monorail when the next stop is on its route.", "Budget time for the size of MGM Grand itself.", "On arena nights, eat before peak event traffic."],
    eventSlugs: ["golden-knights-home-game", "absinthe-las-vegas", "high-roller-observation-wheel", "o-cirque-du-soleil"],
  },
  "allegiant-stadium": {
    title: "Things To Do Near Allegiant Stadium",
    description: "Plan food, attractions, and a realistic pre- or post-event itinerary near Allegiant Stadium.",
    intro: "Allegiant Stadium event days need more transportation buffer than a normal Strip night. Treat the game or concert as the only fixed anchor, eat early, and save flexible attractions for another part of the day.",
    tips: ["Check the stadium's current bag and entry rules.", "Do not schedule a tight reservation immediately after the event.", "Choose a clear group meeting point before entering."],
    eventSlugs: ["golden-knights-home-game", "high-roller-observation-wheel", "absinthe-las-vegas", "sphere-experience"],
  },
  "t-mobile-arena": {
    title: "Things To Do Near T-Mobile Arena",
    description: "Compare sports, shows, food, and attractions that fit before or after an event at T-Mobile Arena.",
    intro: "T-Mobile Arena is one of the easiest event anchors on the Strip because Park MGM and New York-New York are next door. Keep dinner nearby and leave the post-event plan open until you see how quickly the crowd clears.",
    tips: ["Reserve dinner earlier than normal on game nights.", "Use Park MGM or New York-New York as the group meeting point.", "Leave at least an hour after the event before any fixed reservation."],
    eventSlugs: ["golden-knights-home-game", "absinthe-las-vegas", "o-cirque-du-soleil", "high-roller-observation-wheel"],
  },
};
