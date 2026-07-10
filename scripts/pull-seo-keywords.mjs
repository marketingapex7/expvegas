import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function loadDotEnv(path) {
  return readFile(path, "utf8").then((contents) => {
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }).catch(() => undefined);
}

await loadDotEnv(resolve(".env.local"));

const login = process.env.DATAFORSEO_LOGIN?.trim();
const password = process.env.DATAFORSEO_PASSWORD?.trim();
const locationName = process.env.DATAFORSEO_LOCATION_NAME?.trim() || "United States";
const languageCode = process.env.DATAFORSEO_LANGUAGE_CODE?.trim() || "en";
const endpoint = "https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live";

if (!login || !password) {
  console.error("Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD.");
  process.exit(1);
}

const mapPath = resolve("data/seo-topical-map.json");
const outputPath = resolve("data/seo-keywords.json");
const topicMap = JSON.parse(await readFile(mapPath, "utf8"));
const seeds = topicMap.flatMap((topic) => topic.seedKeywords.map((seed) => ({
  seed,
  pageSlug: topic.slug,
  cluster: topic.cluster,
  pageType: topic.pageType,
  intent: topic.intent,
})));

const stopWords = new Set(["in", "the", "to", "of", "for", "las", "vegas"]);
function terms(value) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !stopWords.has(term));
}

function classifyKeyword(keyword, candidates = topicMap) {
  const keywordTerms = new Set(terms(keyword));
  return candidates
    .map((topic) => ({
      topic,
      score: topic.seedKeywords.reduce((best, seed) => {
        const overlap = terms(seed).filter((term) => keywordTerms.has(term)).length;
        return Math.max(best, overlap);
      }, 0),
    }))
    .sort((a, b) => b.score - a.score)[0]?.topic || topicMap[0];
}

function chunks(items, size) {
  const groups = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

const auth = Buffer.from(`${login}:${password}`).toString("base64");
const rows = [];
const seedsByCluster = new Map();
for (const seed of seeds) {
  const clusterSeeds = seedsByCluster.get(seed.cluster) || [];
  clusterSeeds.push(seed);
  seedsByCluster.set(seed.cluster, clusterSeeds);
}

for (const [cluster, clusterSeeds] of seedsByCluster) {
  const clusterTopics = topicMap.filter((topic) => topic.cluster === cluster);
  for (const batch of chunks(clusterSeeds, 20)) {
  console.log(`Pulling ${batch.length} seed keywords (${rows.length} results collected)...`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify([{
        keywords: batch.map((item) => item.seed),
        location_name: locationName,
        language_code: languageCode,
        sort_by: "search_volume",
        include_adult_keywords: false,
        tag: "experiencevegas-topical-map",
      }]),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  const payload = await response.json();
  if (!response.ok || payload.status_code !== 20000) {
    throw new Error(`DataForSEO request failed: ${payload.status_message || response.statusText}`);
  }

  for (const item of payload.tasks?.[0]?.result || []) {
    const source = classifyKeyword(item.keyword, clusterTopics);
    rows.push({
      keyword: item.keyword,
      searchVolume: item.search_volume ?? null,
      monthlySearches: item.monthly_searches ?? [],
      competition: item.competition ?? null,
      competitionIndex: item.competition_index ?? null,
      cpc: item.cpc ?? null,
      pageSlug: source.pageSlug,
      cluster: source.cluster,
      pageType: source.pageType,
      intent: source.intent,
    });
    }
  }
}

const keywords = [...new Map(rows.map((row) => [row.keyword, row])).values()].sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), locationName, languageCode, keywords }, null, 2)}\n`);
console.log(`Saved ${keywords.length} keywords to ${outputPath}`);
