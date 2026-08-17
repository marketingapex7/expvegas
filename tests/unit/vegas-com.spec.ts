import { expect, test } from "vitest";
import { seedEvents } from "@/data/seed-events";
import { VEGAS_COM_TRACKING_LINK, vegasComDestination, vegasComLink, vegasComSubId } from "@/lib/vegas-com";

test("a link with no destination is still a working affiliate link", () => {
  expect(vegasComLink()).toBe(VEGAS_COM_TRACKING_LINK);
  expect(vegasComLink({ path: "" })).toBe(VEGAS_COM_TRACKING_LINK);
});

test("a destination is percent-encoded into the u parameter", () => {
  const link = vegasComLink({ path: "/shows/" });
  expect(link).toBe(`${VEGAS_COM_TRACKING_LINK}?u=https%3A%2F%2Fwww.vegas.com%2Fshows%2F`);
  // The brand reads u= as a URL, so the separators must arrive escaped.
  expect(link).not.toContain("u=https://");
});

test("destinations resolve relative paths and refuse other domains", () => {
  expect(vegasComDestination("/shows/")).toBe("https://www.vegas.com/shows/");
  expect(vegasComDestination("shows/")).toBe("https://www.vegas.com/shows/");
  expect(vegasComDestination("https://www.vegas.com/attractions/")).toBe("https://www.vegas.com/attractions/");
  expect(vegasComDestination("https://vegas.com/tours/")).toBe("https://vegas.com/tours/");

  // Forwarding an arbitrary absolute URL would make our affiliate link an open
  // redirect, and the brand's allowlist would reject it anyway.
  expect(vegasComDestination("https://evil.example.com/phish")).toBeUndefined();
  expect(vegasComDestination("https://notvegas.com/")).toBeUndefined();
  // A lookalike host must not pass on prefix alone.
  expect(vegasComDestination("https://www.vegas.com.evil.example/")).toBeUndefined();
  expect(vegasComDestination(undefined)).toBeUndefined();
});

test("subIds are reduced to what impact.com accepts", () => {
  // Hyphenated slugs are the common case and would otherwise be dropped.
  expect(vegasComSubId("absinthe-las-vegas")).toBe("absinthelasvegas");
  expect(vegasComSubId("Event Card")).toBe("eventcard");
  expect(vegasComSubId("!!!")).toBe("");
  expect(vegasComSubId("a".repeat(300))).toHaveLength(255);
});

test("placement tagging is attached only when it survives sanitizing", () => {
  expect(vegasComLink({ placement: "event-card" })).toBe(`${VEGAS_COM_TRACKING_LINK}?subId1=eventcard`);
  expect(vegasComLink({ placement: "!!!" })).toBe(VEGAS_COM_TRACKING_LINK);
  expect(vegasComLink({ path: "/shows/", placement: "itinerary" })).toBe(
    `${VEGAS_COM_TRACKING_LINK}?u=https%3A%2F%2Fwww.vegas.com%2Fshows%2F&subId1=itinerary`,
  );
});

test("no seed event ships a dead booking link", () => {
  // Every curated event used to carry affiliateUrl "#", which rendered as a
  // disabled button and earned nothing.
  for (const event of seedEvents) {
    expect(event.affiliateUrl, `${event.id} has no booking link`).not.toBe("#");
    expect(event.affiliateUrl).toMatch(/^https:\/\//);
  }
});

test("seed events tag their clicks by event", () => {
  for (const event of seedEvents) {
    expect(event.affiliateUrl, `${event.id} is not click-tagged`).toContain(`subId1=${vegasComSubId(event.slug)}`);
  }
});
