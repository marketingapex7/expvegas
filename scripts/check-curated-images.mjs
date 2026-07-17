import fs from "node:fs/promises";

const files = ["data/seed-events.ts", "lib/directory-data.ts"];
const urls = new Set();

for (const file of files) {
  const source = await fs.readFile(file, "utf8");
  for (const match of source.matchAll(/https:\/\/[^"']+\.(?:com|net)\/[^"']+/g)) {
    if (match[0].includes("photo-") || match[0].includes("ticketm.net")) urls.add(match[0]);
  }
}

const failures = [];
for (const url of urls) {
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!response.ok) failures.push(`${response.status} ${url}`);
  } catch (error) {
    failures.push(`NETWORK ${url} (${error instanceof Error ? error.message : "unknown error"})`);
  }
}

if (failures.length) {
  console.error("Curated image check failed:\n" + failures.join("\n"));
  process.exit(1);
}

console.log(`Checked ${urls.size} curated image URLs.`);
