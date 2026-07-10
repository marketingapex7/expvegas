import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";

export const metadata: Metadata = { title: "Affiliate Disclosure | ExperienceVegas", description: "How affiliate links and commissions work on ExperienceVegas." };

export default function AffiliateDisclosurePage() {
  return (
    <TrustPage title="Affiliate Disclosure" intro="Some outbound links may earn ExperienceVegas a commission when a visitor completes a purchase.">
      <section><h2>How affiliate links work</h2><p>ExperienceVegas may participate in affiliate programs with ticket, activity, hotel, restaurant, or travel providers. If you follow an eligible link and buy something, the provider may pay us a commission. This normally does not change the price you pay.</p></section>
      <section><h2>How picks are selected</h2><p>Recommendations are intended to prioritize fit for the visitor&apos;s dates, group, budget, location, and preferences. An affiliate relationship does not guarantee a positive review or placement, and not every recommendation has an affiliate relationship.</p></section>
      <section><h2>Prices and provider terms</h2><p>Displayed prices may be estimates or starting prices and may not include every fee. The provider&apos;s checkout page controls the final price, inventory, refund rules, and transaction terms.</p></section>
      <section><h2>Questions</h2><p>Questions about a commercial relationship or specific link can be sent to <a href="mailto:hello@experiencevegas.com">hello@experiencevegas.com</a>.</p></section>
    </TrustPage>
  );
}
