import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TripSelectionProvider } from "@/components/TripSelectionProvider";
import { TripTray } from "@/components/TripTray";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://experiencevegas.com"),
  title: {
    default: "ExperienceVegas | Build a Better Vegas Trip",
    template: "%s | ExperienceVegas",
  },
  description: "Find the Vegas shows, attractions, comedy, sports, concerts, and experiences actually worth booking for your trip.",
  applicationName: "ExperienceVegas",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ExperienceVegas",
    title: "ExperienceVegas | Build a Better Vegas Trip",
    description: "Turn your dates, budget, group, location, and vibe into a practical Las Vegas itinerary.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ExperienceVegas personalized Las Vegas trip planner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExperienceVegas | Build a Better Vegas Trip",
    description: "Turn your dates, budget, group, location, and vibe into a practical Las Vegas itinerary.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen pb-24 antialiased md:pb-28">
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://experiencevegas.com/#organization",
              name: "ExperienceVegas",
              url: "https://experiencevegas.com",
            },
            {
              "@type": "WebSite",
              "@id": "https://experiencevegas.com/#website",
              name: "ExperienceVegas",
              url: "https://experiencevegas.com",
              publisher: { "@id": "https://experiencevegas.com/#organization" },
            },
          ],
        }} />
        <TripSelectionProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <TripTray />
        </TripSelectionProvider>
      </body>
    </html>
  );
}
