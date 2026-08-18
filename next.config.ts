import type { NextConfig } from "next";

const developmentScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // googletagmanager.com is allowed so the GTM container can load when
  // NEXT_PUBLIC_GTM_ID is set. Vercel Analytics needs no allowance: it is
  // served and beaconed from this origin under /_vercel/insights.
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${developmentScriptPolicy}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss: https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    minimumCacheTTL: 86_400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.ticketm.net",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/shows", destination: "/las-vegas-shows", permanent: true },
      { source: "/hotels", destination: "/las-vegas-hotels", permanent: true },
      { source: "/restaurants", destination: "/las-vegas-restaurants", permanent: true },
      { source: "/things-to-do", destination: "/things-to-do-las-vegas", permanent: true },
      { source: "/itinerary", destination: "/my-trip", permanent: true },
      { source: "/comedy", destination: "/las-vegas-comedy", permanent: true },
      { source: "/concerts", destination: "/las-vegas-concerts", permanent: true },
      { source: "/sports", destination: "/las-vegas-sports", permanent: true },
      { source: "/attractions", destination: "/las-vegas-attractions", permanent: true },
      { source: "/best/first-timers", destination: "/las-vegas-first-time-visitors", permanent: true },
      { source: "/best/couples", destination: "/las-vegas-for-couples", permanent: true },
      { source: "/best/families", destination: "/las-vegas-for-families", permanent: true },
      { source: "/best/under-100", destination: "/las-vegas-shows-under-100", permanent: true },
      { source: "/best/las-vegas-first-time-visitors", destination: "/las-vegas-first-time-visitors", permanent: true },
      { source: "/best/las-vegas-for-couples", destination: "/las-vegas-for-couples", permanent: true },
      { source: "/best/las-vegas-for-families", destination: "/las-vegas-for-families", permanent: true },
      { source: "/best/las-vegas-shows-under-100", destination: "/las-vegas-shows-under-100", permanent: true },
    ];
  },
};

export default nextConfig;
