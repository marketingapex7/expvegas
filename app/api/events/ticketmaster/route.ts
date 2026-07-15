import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/api-security";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";

const categories = ["shows", "comedy", "sports", "concerts", "attractions"] as const;
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => Number.isFinite(Date.parse(`${value}T00:00:00Z`)));
const querySchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  category: z.enum(categories).optional(),
  size: z.coerce.number().int().min(1).max(50).default(20),
}).superRefine((query, context) => {
  if (!query.startDate || !query.endDate) return;
  const days = (Date.parse(`${query.endDate}T00:00:00Z`) - Date.parse(`${query.startDate}T00:00:00Z`)) / 86_400_000;
  if (days < 0 || days > 31) context.addIssue({ code: "custom", path: ["endDate"], message: "Choose a range of no more than 31 days." });
});

export async function GET(request: Request) {
  const limited = rateLimit(request, "ticketmaster:search", 60, 10 * 60 * 1_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const query = querySchema.safeParse({
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    category: searchParams.get("category") || undefined,
    size: searchParams.get("size") || undefined,
  });

  if (!query.success) {
    return NextResponse.json({ events: [], error: "Invalid event search parameters." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const events = await searchTicketmasterEvents({
      startDate: query.data.startDate,
      endDate: query.data.endDate,
      category: query.data.category,
      size: query.data.size,
    });

    return NextResponse.json({ events }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch Ticketmaster events";
    const status = message.includes("Missing TICKETMASTER_API_KEY") ? 503 : 502;
    console.error("Ticketmaster event search failed", message);

    return NextResponse.json({ events: [], error: "Live event search is temporarily unavailable." }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
