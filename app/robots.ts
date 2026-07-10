import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://experiencevegas.com";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/plan/"] }, sitemap: `${baseUrl}/sitemap.xml` };
}
