export type GoCityPassType = "essentials" | "explorer" | "all-inclusive";

export const goCityAffiliateLinks = {
  overview: "https://gocity.tp.st/Bqimx42z",
  essentials: "https://gocity.tp.st/RBk5I3YJ",
  explorer: "https://gocity.tp.st/cp5kmT1f",
  "all-inclusive": "https://gocity.tp.st/GagSsQO5",
} as const;

export function goCityBookingUrl(passTypes: GoCityPassType[]) {
  if (passTypes.length === 1) return goCityAffiliateLinks[passTypes[0]];
  if (passTypes.includes("explorer")) return goCityAffiliateLinks.explorer;
  return goCityAffiliateLinks.overview;
}

export function formatGoCityPasses(passTypes: GoCityPassType[]) {
  const labels: Record<GoCityPassType, string> = {
    essentials: "Essentials",
    explorer: "Explorer",
    "all-inclusive": "All-Inclusive",
  };
  return passTypes.map((pass) => labels[pass]).join(" + ");
}
