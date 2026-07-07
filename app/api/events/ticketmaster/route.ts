import { NextResponse } from "next/server";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";
import { EventCategory } from "@/types/event";

const categories: EventCategory[] = ["shows", "comedy", "sports", "concerts", "attractions"];

function categoryFromParam(value: string | null) {
  return categories.find((category) => category === value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const events = await searchTicketmasterEvents({
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      category: categoryFromParam(searchParams.get("category")),
      size: Number(searchParams.get("size") || 20),
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch Ticketmaster events";
    const status = message.includes("Missing TICKETMASTER_API_KEY") ? 500 : 502;

    return NextResponse.json({ events: [], error: message }, { status });
  }
}
