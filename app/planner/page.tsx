import { PlannerForm } from "@/components/PlannerForm";
import { SectionHeader } from "@/components/SectionHeader";

export default function PlannerPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Vegas Planner" title="Tell us the trip. Get the plan." description="This first version ranks seed events. Next step: ground the output in Supabase inventory, Ticketmaster events, and LLM-written explanations." />
        <PlannerForm />
      </div>
    </section>
  );
}
