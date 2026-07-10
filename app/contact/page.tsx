import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";

export const metadata: Metadata = { title: "Contact | ExperienceVegas", description: "Contact ExperienceVegas about trip plans, corrections, partnerships, or privacy." };

export default function ContactPage() {
  return (
    <TrustPage title="Contact ExperienceVegas" intro="Send questions, corrections, partnership inquiries, or saved-plan support requests to the team.">
      <section><h2>Email</h2><p><a href="mailto:hello@experiencevegas.com">hello@experiencevegas.com</a></p><p>Include the page URL or private plan link when reporting a specific issue. Do not send payment-card details, passwords, or other sensitive information.</p></section>
      <section><h2>Booking support</h2><p>For a charge, refund, cancellation, ticket-delivery problem, reservation change, or venue-access question, contact the company shown on your receipt. ExperienceVegas does not control third-party transactions.</p></section>
      <section><h2>Corrections</h2><p>Schedules and Vegas operating details move quickly. We welcome corrections to venue names, hours, availability, closures, and accessibility details.</p></section>
    </TrustPage>
  );
}
