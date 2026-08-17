import { expect, test } from "vitest";
import { sanitizeSchedule } from "@/lib/itinerary-engine";
import { estimateVegasTravel, inferVegasZone } from "@/lib/vegas-logistics";

test("Vegas zone estimates distinguish short clusters from cross-city jumps", () => {
  expect(inferVegasZone("Sphere at The Venetian")).toBe("North Strip");
  expect(inferVegasZone("Allegiant Stadium")).toBe("South Strip");

  const sameArea = estimateVegasTravel("Bellagio", "Bellagio");
  expect(sameArea).toMatchObject({ minMinutes: 5, maxMinutes: 10 });

  const longJump = estimateVegasTravel("Allegiant Stadium", "Fremont Street");
  expect(longJump).toMatchObject({
    fromZone: "South Strip",
    toZone: "Downtown",
    minMinutes: 30,
    maxMinutes: 50,
  });
});

test("schedule sanitation protects fixed events with zone-aware travel time", () => {
  const schedule = sanitizeSchedule([
    {
      time: "6:00 PM",
      title: "Dinner at Mandalay Bay",
      category: "meal",
      location: "Mandalay Bay",
      durationMinutes: 90,
    },
    {
      time: "8:00 PM",
      title: "Sphere show",
      category: "event",
      location: "Sphere",
      durationMinutes: 120,
    },
  ]);

  expect(schedule[0].time).toBe("5:45 PM");
  expect(schedule[0].timingNote).toContain("protect the fixed event start");
  expect(schedule[1].time).toBe("8:00 PM");
});
