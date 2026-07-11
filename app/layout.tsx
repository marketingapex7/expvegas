import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
  },
  twitter: {
    card: "summary",
    title: "ExperienceVegas | Build a Better Vegas Trip",
    description: "Turn your dates, budget, group, location, and vibe into a practical Las Vegas itinerary.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
