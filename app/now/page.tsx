import type { Metadata } from "next";
import { WhatNow } from "@/components/WhatNow";

export const metadata: Metadata = {
  title: "What Should We Do Now?",
  description: "Choose the best next stop from your saved Las Vegas itinerary based on time, area, and budget.",
  robots: { index: false, follow: false },
};

export default function WhatNowPage() {
  return <WhatNow />;
}
