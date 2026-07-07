export type PlannerInput = {
  travelDates?: string;
  prompt?: string;
  groupType?: string;
  budget?: string;
  vibe?: string;
  stayingNear?: string;
  dealbreakers?: string;
};

export type PlannerOutput = {
  headline: string;
  bestPickId: string;
  whyItFits: string;
  timeline: { time: string; title: string; description?: string }[];
  backupPickIds: string[];
  cheaperVersion?: string;
  premiumVersion?: string;
  avoid?: string[];
};

export type PlannerResponse = PlannerOutput & {
  bestPickName: string;
  backupPickNames: string[];
  sourceSummary?: string;
};
