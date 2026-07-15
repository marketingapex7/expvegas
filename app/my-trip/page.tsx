import type { Metadata } from "next";
import { SavedTripWorkspace } from "@/components/SavedTripWorkspace";

export const metadata: Metadata = {
  title: "My Itinerary",
  description: "Review your saved Las Vegas hotels, events, restaurants, attractions, and experiences before building a timed itinerary.",
  robots: { index: false, follow: false },
};

export default function MyTripPage() {
  return <SavedTripWorkspace />;
}
