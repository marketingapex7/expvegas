import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";

export const metadata: Metadata = { title: "Privacy Policy | ExperienceVegas", description: "How ExperienceVegas handles trip-planning information and saved itineraries." };

export default function PrivacyPage() {
  return (
    <TrustPage title="Privacy Policy" intro="This policy explains what information ExperienceVegas uses to build and save a trip plan, and the choices visitors have.">
      <section><h2>Information you provide</h2><p>Trip-planning inputs may include travel dates, group type, budget, lodging area, food preferences, desired activities, and additional details. If you choose to attach an email address to a saved plan, we store that address with the plan.</p></section>
      <section><h2>How information is used</h2><p>We use submitted details to generate, save, retrieve, and improve the requested itinerary. We do not require an account. A saved-plan link acts as a private access key, so visitors should share it only with people they trust.</p></section>
      <section><h2>Storage and retention</h2><p>Saved plans are stored through Supabase and are scheduled to expire 30 days after creation. Hosting and service providers may process standard technical information such as IP address, browser data, request logs, and error reports to deliver and secure the site.</p></section>
      <section><h2>Third-party services</h2><p>ExperienceVegas may use Supabase for saved plans, Vercel for hosting, and event or travel providers such as Ticketmaster and TravelPayouts for availability and outbound booking links. A third party&apos;s own privacy policy applies after you leave ExperienceVegas.</p></section>
      <section><h2>Your choices</h2><p>You may use the planner without providing an email address. To request deletion of a saved itinerary or ask a privacy question, contact <a href="mailto:hello@experiencevegas.com">hello@experiencevegas.com</a> and include the saved-plan link when relevant.</p></section>
    </TrustPage>
  );
}
