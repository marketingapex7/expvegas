import { expect, test, vi } from "vitest";

/** Minimal stand-in for fetch; only ok/status are read by checkUrl. */
const asFetch = (impl: (url: string, init: { method: string }) => Promise<{ ok: boolean; status: number }>) =>
  impl as unknown as typeof fetch;

/** Minimal stand-in for fs.readFile; collectCuratedLinks only reads text. */
const asReadFile = (impl: (name: string) => Promise<string>) => impl as unknown as typeof import("node:fs/promises").readFile;
import {
  affiliateLinkProblem,
  checkUrl,
  collectCuratedLinks,
  egressWorks,
  deepLinkDestination,
  extractUrls,
  isAffiliateLink,
} from "../../scripts/curated-links.mjs";

const TRACKING = "https://vegas.vdvm.net/c/3676661/260030/4221";

test("affiliate tracking links are recognised and never treated as fetchable", () => {
  expect(isAffiliateLink(TRACKING)).toBe(true);
  expect(isAffiliateLink("https://gocity.tp.st/Bqimx42z")).toBe(true);
  expect(isAffiliateLink("https://www.caesars.com/restaurants")).toBe(false);
  expect(isAffiliateLink("not a url")).toBe(false);
});

test("collecting links keeps tracking links out of the fetch set", async () => {
  const files: Record<string, string> = {
    "data/restaurants.ts": 'reservationUrl: "https://www.caesars.com/bacchanal",',
    "data/seed-events.ts": `affiliateUrl: "${TRACKING}?u=https%3A%2F%2Fwww.vegas.com%2Fshows%2F&subId1=absinthe",`,
  };
  const readFile = asReadFile(async (name: string) => {
    if (!(name in files)) throw new Error("ENOENT");
    return files[name];
  });

  const { affiliate, fetchable } = await collectCuratedLinks(readFile);

  // Requesting a tracking link would register a click and corrupt reporting.
  expect([...fetchable.keys()]).not.toContain(TRACKING);
  expect([...affiliate.keys()].some((url) => url.startsWith(TRACKING))).toBe(true);
  // The destination behind the deep link is a normal page, so a dead show is
  // still caught without touching the tracker.
  expect([...fetchable.keys()]).toContain("https://www.vegas.com/shows/");
  expect([...fetchable.keys()]).toContain("https://www.caesars.com/bacchanal");
});

test("images are left to the image checker", () => {
  const urls = extractUrls(`
    imageUrl: "https://images.unsplash.com/photo-123?auto=format",
    other: "https://s1.ticketm.net/dam/a/abc.jpg",
    reservationUrl: "https://www.wynnlasvegas.com/dining",
  `);
  expect(urls).toEqual(["https://www.wynnlasvegas.com/dining"]);
});

test("a well formed tracking link reports no problem", () => {
  expect(affiliateLinkProblem(TRACKING)).toBeUndefined();
  expect(affiliateLinkProblem(`${TRACKING}?subId1=absinthelasvegas`)).toBeUndefined();
  expect(affiliateLinkProblem(`${TRACKING}?u=https%3A%2F%2Fwww.vegas.com%2Fshows%2F`)).toBeUndefined();
});

test("shape validation catches the failures that stay silent in production", () => {
  // An unencoded destination is dropped by the network and the visitor lands on
  // the program's default page, which looks like a working link.
  expect(affiliateLinkProblem(`${TRACKING}?u=https://www.vegas.com/shows/`)).toMatch(/percent-encoded/);
  expect(affiliateLinkProblem(`${TRACKING}?u=/shows/`)).toMatch(/absolute https/);
  // impact.com accepts letters and numbers only, so a hyphenated slug reports
  // nothing at all.
  expect(affiliateLinkProblem(`${TRACKING}?subId1=absinthe-las-vegas`)).toMatch(/letters and numbers only/);
  expect(affiliateLinkProblem("https://vegas.vdvm.net/shows")).toMatch(/impact\.com/);
});

test("deep link destinations are extracted for checking", () => {
  expect(deepLinkDestination(`${TRACKING}?u=https%3A%2F%2Fwww.vegas.com%2Fshows%2F`)).toBe(
    "https://www.vegas.com/shows/",
  );
  expect(deepLinkDestination(TRACKING)).toBeUndefined();
});

test("a HEAD-hostile venue site is not reported as dead", async () => {
  // Many venue sites reject HEAD but serve GET fine. Reporting those would bury
  // real breakage in noise.
  const fetchImpl = vi.fn(async (_url: string, init: { method: string }) =>
    init.method === "HEAD" ? { ok: false, status: 405 } : { ok: true, status: 200 },
  );
  expect(await checkUrl("https://example.com/a", asFetch(fetchImpl))).toEqual({ status: "ok" });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test("a refused client is unverified, never healthy", async () => {
  // A live site blocking bots and a proxy blocking the whole request are
  // indistinguishable from here. Counting either as healthy is how a checker
  // reports all-clear while reaching nothing, which is exactly what an earlier
  // version of this script did behind a proxy that answered 403 to everything.
  const forbidden = asFetch(async () => ({ ok: false, status: 403 }));
  expect(await checkUrl("https://example.com/a", forbidden)).toMatchObject({ status: "unverified" });

  const unauthorized = asFetch(async () => ({ ok: false, status: 401 }));
  expect(await checkUrl("https://example.com/a", unauthorized)).toMatchObject({ status: "unverified" });
});

test("a genuinely dead page is reported", async () => {
  const gone = asFetch(async () => ({ ok: false, status: 404 }));
  expect(await checkUrl("https://example.com/closed", gone)).toEqual({ status: "dead", detail: "404" });

  const offline = asFetch(async () => {
    throw new Error("ENOTFOUND");
  });
  expect(await checkUrl("https://example.com/gone", offline)).toEqual({ status: "dead", detail: "ENOTFOUND" });
});

test("the canary decides whether any result is meaningful", async () => {
  const open = asFetch(async () => ({ ok: true, status: 200 }));
  expect(await egressWorks(open)).toBe(true);

  // A runner behind a blocking proxy must report that it cannot verify rather
  // than that everything is fine.
  const blocked = asFetch(async () => ({ ok: false, status: 403 }));
  expect(await egressWorks(blocked)).toBe(false);
});
