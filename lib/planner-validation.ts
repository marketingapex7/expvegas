import { z } from "zod";

const shortText = z.string().trim().max(500);
const categorySchema = z.enum(["shows", "comedy", "sports", "concerts", "attractions"]);
const itineraryCategorySchema = z.enum(["meal", "event", "attraction", "casino", "shopping", "transit", "free"]);
const safeLink = z
  .string()
  .max(2_048)
  .refine((value) => value === "#" || /^https?:\/\//i.test(value), { message: "Links must use HTTP or HTTPS." });

export const plannerInputSchema = z
  .object({
    travelDates: z.string().trim().max(120),
    prompt: z.string().trim().max(2_000).optional(),
    groupType: shortText.optional(),
    budget: shortText.optional(),
    vibe: shortText.optional(),
    stayingNear: shortText.optional(),
    dealbreakers: shortText.optional(),
    foodPreference: shortText.optional(),
    mealBudget: shortText.optional(),
    gamblingPreference: shortText.optional(),
    pace: shortText.optional(),
    logistics: shortText.optional(),
    additionalDetails: z.string().trim().max(1_500).optional(),
  })
  .superRefine((input, context) => {
    const dates = input.travelDates.match(/\d{4}-\d{2}-\d{2}/g) || [];
    if (dates.length < 2) {
      context.addIssue({ code: "custom", path: ["travelDates"], message: "Arrival and departure dates are required." });
      return;
    }

    const start = Date.parse(`${dates[0]}T00:00:00Z`);
    const end = Date.parse(`${dates[1]}T00:00:00Z`);
    const tripDays = Math.round((end - start) / 86_400_000);
    if (!Number.isFinite(start) || !Number.isFinite(end) || tripDays < 0 || tripDays > 7) {
      context.addIssue({ code: "custom", path: ["travelDates"], message: "Choose valid dates spanning no more than seven days." });
    }
  });

const itineraryBlockSchema = z.object({
  time: z.string().max(40),
  title: z.string().max(300),
  category: itineraryCategorySchema,
  location: z.string().max(300).optional(),
  description: z.string().max(2_000).optional(),
  bookingUrl: safeLink.optional(),
  priceHint: z.string().max(120).optional(),
  durationMinutes: z.number().int().min(1).max(1_440).optional(),
  timingNote: z.string().max(500).optional(),
});

const itineraryDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().max(120),
  theme: z.string().max(500),
  blocks: z.array(itineraryBlockSchema).max(20),
});

const eventOptionSchema = z.object({
  id: z.string().max(300),
  name: z.string().max(300),
  category: categorySchema,
  venueName: z.string().max(300),
  quickVerdict: z.string().max(2_000),
  affiliateUrl: safeLink.optional(),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  runtimeMinutes: z.number().int().min(1).max(1_440).optional(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  localTime: z.string().regex(/^\d{2}:\d{2}/).optional(),
});

export const plannerResponseSchema = z.object({
  headline: z.string().max(500),
  bestPickId: z.string().max(300),
  bestPickName: z.string().max(300),
  whyItFits: z.string().max(3_000),
  timeline: z.array(z.object({ time: z.string().max(40), title: z.string().max(300), description: z.string().max(2_000).optional() })).max(30),
  backupPickIds: z.array(z.string().max(300)).max(20),
  backupPickNames: z.array(z.string().max(300)).max(20),
  cheaperVersion: z.string().max(300).optional(),
  premiumVersion: z.string().max(300).optional(),
  avoid: z.array(z.string().max(500)).max(20).optional(),
  sourceSummary: z.string().max(2_000).optional(),
  eventOptions: z.array(eventOptionSchema).max(40).optional(),
  itineraryDays: z.array(itineraryDaySchema).max(7).optional(),
  tripSummary: z
    .object({
      lodging: z.string().max(500),
      bestLodgingZone: z.string().max(1_000).optional(),
      tripStyle: z.array(z.string().max(300)).max(20),
      assumptions: z.array(z.string().max(500)).max(20).optional(),
      estimatedSpend: z.string().max(500),
      bookNow: z.array(z.string().max(500)).max(30),
      keepFlexible: z.array(z.string().max(500)).max(30),
      whyThisPlanWorks: z.string().max(3_000),
    })
    .optional(),
});

export const savePlanRequestSchema = z.object({
  input: plannerInputSchema,
  result: plannerResponseSchema,
  email: z.string().trim().email().max(254).optional(),
});

export const updatePlanRequestSchema = z
  .object({
    email: z.string().trim().email().max(254).optional(),
    result: plannerResponseSchema.optional(),
  })
  .refine((body) => Boolean(body.email || body.result), { message: "An email or updated plan is required." });
