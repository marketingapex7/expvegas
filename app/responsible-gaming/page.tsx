import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";

export const metadata: Metadata = { title: "Responsible Gaming | ExperienceVegas", description: "Practical responsible-gaming guidance and current help resources for Las Vegas visitors." };

export default function ResponsibleGamingPage() {
  return (
    <TrustPage title="Responsible Gaming" intro="Gambling is optional. A good Vegas plan should work even when casino time is skipped entirely.">
      <section><h2>Keep it recreational</h2><ul><li>Set a total bankroll before the trip and treat it as entertainment spending.</li><li>Do not chase losses or borrow money to gamble.</li><li>Use time limits and keep meals, sleep, shows, and non-gaming activities in the plan.</li><li>Never gamble while impaired or under pressure from the group.</li></ul></section>
      <section><h2>Age and venue rules</h2><p>Casino gambling in Nevada is restricted to people age 21 and older. Venue access and gaming rules can differ, so confirm current requirements directly with the property and the <a href="https://www.gaming.nv.gov/" target="_blank" rel="noopener noreferrer">Nevada Gaming Control Board</a>.</p></section>
      <section><h2>Get support</h2><p>If gambling is causing distress or no longer feels recreational, stop and seek support. The National Council on Problem Gambling provides information and connections to local resources through the <a href="https://www.ncpgambling.org/help-treatment/" target="_blank" rel="noopener noreferrer">National Problem Gambling Helpline</a> at <a href="tel:18006973738">1-800-MY-RESET</a>.</p><p>The helpline is not an emergency service. For immediate danger or a medical emergency, call local emergency services.</p></section>
    </TrustPage>
  );
}
