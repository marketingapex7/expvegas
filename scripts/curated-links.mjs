import fs from "node:fs/promises";

/**
 * Curated data is hand-written and never expires on its own. A closed
 * restaurant keeps recommending itself, and a moved booking page keeps 404ing,
 * because nothing checks. This module finds the links and decides which ones
 * are safe to request.
 *
 * The pure helpers are exported so they can be tested without network access.
 */

export const CURATED_SOURCES = [
  "data/restaurants.ts",
  "data/go-city-attractions.ts",
  "data/hotels.ts",
  "data/seed-events.ts",
  "data/planning-stops.ts",
  "lib/directory-data.ts",
  "lib/go-city.ts",
];

/**
 * Affiliate networks count a request to a tracking link as a click. Checking
 * these on a schedule would file bot traffic as real interest and corrupt the
 * reporting the links exist to produce, so they are validated by shape only.
 */
export const AFFILIATE_HOSTS = ["vegas.vdvm.net", "gocity.tp.st"];

export function isAffiliateLink(url) {
  try {
    return AFFILIATE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Images have their own checker; this one is about destinations. */
function isImage(url) {
  return /images\.unsplash\.com|\.ticketm\.net|\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(url);
}

export function extractUrls(source) {
  return [...new Set(source.match(/https:\/\/[^"'`\s)]+/g) || [])].filter((url) => !isImage(url));
}

/**
 * A tracking link is well formed when it keeps the publisher path and, if it
 * deep links, carries a percent-encoded destination. An unencoded `u=` is the
 * failure that silently drops visitors on the program's default page.
 */
export function affiliateLinkProblem(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "is not a valid URL";
  }

  if (!/^\/c\/\d+\/\d+\/\d+$/.test(parsed.pathname) && parsed.hostname === "vegas.vdvm.net") {
    return "does not look like an impact.com /c/<publisher>/<campaign>/<ad> path";
  }

  const destination = parsed.searchParams.get("u");
  if (destination !== null) {
    if (!/^https:\/\//i.test(destination)) return "has a u= destination that is not an absolute https URL";
    if (!url.includes("u=https%3A")) return "has a u= destination that is not percent-encoded";
  }

  for (const [key, value] of parsed.searchParams) {
    if (/^subId[123]$|^sharedid$/i.test(key) && !/^[a-z0-9]+$/i.test(value)) {
      return `has ${key}="${value}", which impact.com will drop (letters and numbers only)`;
    }
  }

  return undefined;
}

/**
 * The destination inside a deep link is a normal page and safe to request, so
 * a dead show page is still caught without the tracking link being touched.
 */
export function deepLinkDestination(url) {
  try {
    return new URL(url).searchParams.get("u") || undefined;
  } catch {
    return undefined;
  }
}

export async function collectCuratedLinks(readFile = fs.readFile) {
  const affiliate = new Map();
  const fetchable = new Map();

  for (const file of CURATED_SOURCES) {
    let source;
    try {
      source = await readFile(file, "utf8");
    } catch {
      continue;
    }

    for (const url of extractUrls(source)) {
      if (isAffiliateLink(url)) {
        affiliate.set(url, file);
        const destination = deepLinkDestination(url);
        if (destination) fetchable.set(destination, `${file} (deep link destination)`);
      } else {
        fetchable.set(url, file);
      }
    }
  }

  return { affiliate, fetchable };
}

/**
 * A control URL proven reachable from anywhere with open egress. If this fails,
 * the run cannot see the internet, and every other result is meaningless.
 */
export const CANARY_URL = "https://example.com/";

/**
 * Plenty of venue sites reject HEAD or bot user agents, so a failure is only
 * reported after a GET has also failed.
 *
 * 401 and 403 are reported as "unverified" rather than healthy. A real site
 * refusing a script and a network refusing the request entirely are
 * indistinguishable from here -- a sandboxed or proxied runner answers 403 to
 * everything -- and calling that healthy is how a checker reports all-clear
 * while reaching nothing.
 */
export async function checkUrl(url, fetchImpl = fetch) {
  const init = {
    redirect: "follow",
    headers: { "user-agent": "Mozilla/5.0 (compatible; ExperienceVegas link check)" },
  };

  for (const method of ["HEAD", "GET"]) {
    try {
      const response = await fetchImpl(url, { ...init, method });
      if (response.ok) return { status: "ok" };
      if (response.status === 401 || response.status === 403) {
        return { status: "unverified", detail: `${response.status} (refused this client)` };
      }
      if (method === "GET") return { status: "dead", detail: `${response.status}` };
    } catch (error) {
      if (method === "GET") {
        return { status: "dead", detail: error instanceof Error ? error.message : "request failed" };
      }
    }
  }

  return { status: "ok" };
}

/** True when the runner can actually reach the open internet. */
export async function egressWorks(fetchImpl = fetch) {
  const result = await checkUrl(CANARY_URL, fetchImpl);
  return result.status === "ok";
}
