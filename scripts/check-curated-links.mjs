import {
  affiliateLinkProblem,
  CANARY_URL,
  checkUrl,
  collectCuratedLinks,
  egressWorks,
} from "./curated-links.mjs";

/**
 * Reports dead destinations in curated data and malformed affiliate links.
 *
 * Run on a schedule rather than per pull request: link rot depends on third
 * party uptime, and a gate that fails because someone else's site is briefly
 * down blocks deploys without saying anything true about the change.
 */

const CONCURRENCY = 6;

async function mapWithLimit(items, limit, worker) {
  const results = [];
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const { affiliate, fetchable } = await collectCuratedLinks();

// Shape checks need no network, so they run either way.
const shapeFailures = [];
for (const [url, file] of affiliate) {
  const problem = affiliateLinkProblem(url);
  if (problem) shapeFailures.push(`SHAPE   ${file}: ${url}\n        ${problem}`);
}

if (!(await egressWorks())) {
  console.error(
    `Cannot reach ${CANARY_URL}, so this runner has no open internet access.\n` +
      "Refusing to report on curated links: every request would fail or be refused\n" +
      "identically, and an all-clear from here would mean nothing.",
  );
  if (shapeFailures.length > 0) {
    console.error(`\nAffiliate link shape problems (checked without network):\n\n${shapeFailures.join("\n\n")}`);
  }
  process.exit(1);
}

const entries = [...fetchable.entries()];
const results = await mapWithLimit(entries, CONCURRENCY, async ([url]) => checkUrl(url));

const dead = [];
const unverified = [];
results.forEach((result, index) => {
  const [url, file] = entries[index];
  if (result.status === "dead") dead.push(`DEAD    ${file}: ${url}\n        ${result.detail}`);
  if (result.status === "unverified") unverified.push(`  ${url} — ${result.detail}`);
});

const reachable = results.filter((result) => result.status === "ok").length;
console.log(
  `Checked ${entries.length} destination link${entries.length === 1 ? "" : "s"}: ` +
    `${reachable} reachable, ${unverified.length} unverified, ${dead.length} dead.`,
);
console.log(
  `Validated ${affiliate.size} affiliate link${affiliate.size === 1 ? "" : "s"} by shape. ` +
    "Tracking links are never requested: a request would register as a click.",
);

if (unverified.length > 0) {
  // Not a failure. These sites refuse automated clients but are live for people.
  console.log(`\nUnverified (site refused this client, check by hand if suspicious):\n${unverified.join("\n")}`);
}

if (shapeFailures.length > 0 || dead.length > 0) {
  const failures = [...shapeFailures, ...dead];
  console.error(`\n${failures.length} problem${failures.length === 1 ? "" : "s"} found:\n`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log("\nNo dead links and no malformed affiliate links.");
