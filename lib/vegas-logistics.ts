import { VegasZone } from "@/types/directory";

export type VegasTravelEstimate = {
  fromZone: VegasZone;
  toZone: VegasZone;
  minMinutes: number;
  maxMinutes: number;
  label: string;
};

const zonePairs: Record<string, [number, number]> = {
  "Center Strip|North Strip": [12, 25],
  "Center Strip|South Strip": [12, 25],
  "Center Strip|Downtown": [20, 35],
  "Center Strip|Off Strip": [15, 30],
  "North Strip|South Strip": [22, 40],
  "Downtown|North Strip": [15, 30],
  "North Strip|Off Strip": [18, 35],
  "Downtown|South Strip": [30, 50],
  "Off Strip|South Strip": [18, 35],
  "Downtown|Off Strip": [20, 35],
};

export function inferVegasZone(value?: string): VegasZone {
  const text = (value || "").toLowerCase();

  if (/(downtown|fremont|arts district|circa|golden nugget)/.test(text)) return "Downtown";
  if (/(off strip|chinatown|spring mountain|durango|red rock|summerlin|eastside|westside)/.test(text)) return "Off Strip";
  if (/(sphere|venetian|palazzo|wynn|encore|resorts world|sahara|north strip)/.test(text)) return "North Strip";
  if (/(allegiant|mandalay|luxor|excalibur|mgm grand|park mgm|new york-new york|t-mobile|south strip)/.test(text)) return "South Strip";
  return "Center Strip";
}

export function estimateVegasTravel(
  fromArea?: string,
  toArea?: string,
  fromZone = inferVegasZone(fromArea),
  toZone = inferVegasZone(toArea),
): VegasTravelEstimate {
  const sameArea = Boolean(fromArea && toArea && fromArea.trim().toLowerCase() === toArea.trim().toLowerCase());
  if (sameArea) {
    return { fromZone, toZone, minMinutes: 5, maxMinutes: 10, label: "Same resort or immediate area" };
  }

  if (fromZone === toZone) {
    return { fromZone, toZone, minMinutes: 8, maxMinutes: 18, label: `Within ${fromZone}` };
  }

  const pairKey = [fromZone, toZone].sort().join("|");
  const [minMinutes, maxMinutes] = zonePairs[pairKey] || [20, 40];
  return { fromZone, toZone, minMinutes, maxMinutes, label: `${fromZone} to ${toZone}` };
}
