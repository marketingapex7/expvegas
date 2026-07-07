import { PlannerForm } from "@/components/PlannerForm";
import { SectionHeader } from "@/components/SectionHeader";

export default function PlannerPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Vegas Game Plan" title="Tell us the trip. Get a timed plan." description="Build a day-by-day plan across live events, restaurants, casino time, attractions, and nearby follow-ups." />
        <PlannerForm />
      </div>
    </section>
  );
}
