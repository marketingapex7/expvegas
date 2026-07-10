import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";

export const metadata: Metadata = { title: "Terms of Use | ExperienceVegas", description: "Terms for using ExperienceVegas trip-planning information and links." };

export default function TermsPage() {
  return (
    <TrustPage title="Terms of Use" intro="ExperienceVegas provides planning information and recommendations. These terms describe the limits of that service.">
      <section><h2>Planning information</h2><p>Itineraries are suggestions, not guarantees. Event schedules, prices, fees, operating hours, travel times, age restrictions, and availability can change. Confirm material details directly with the venue or booking provider before purchasing or traveling.</p></section>
      <section><h2>Third-party bookings</h2><p>Tickets, reservations, hotels, and other products are provided by third parties. Their terms, refund rules, privacy policies, and customer-service processes apply to your transaction. ExperienceVegas is not the ticket issuer, venue, hotel, restaurant, gaming operator, or travel agent.</p></section>
      <section><h2>Visitor responsibilities</h2><p>You are responsible for deciding whether a recommendation is appropriate for your group, budget, health, accessibility needs, and legal eligibility. Do not rely on an itinerary for emergency, medical, legal, or financial advice.</p></section>
      <section><h2>Acceptable use</h2><p>Do not misuse the site, probe or disrupt its systems, submit unlawful content, automate excessive requests, or attempt to access another visitor&apos;s private plan without permission.</p></section>
      <section><h2>Changes and questions</h2><p>We may update the site and these terms as the service develops. Questions can be sent to <a href="mailto:hello@experiencevegas.com">hello@experiencevegas.com</a>.</p></section>
    </TrustPage>
  );
}
