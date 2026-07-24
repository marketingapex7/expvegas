import { expect, test } from "@playwright/test";

async function jsonLdTypes(page: import("@playwright/test").Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.flatMap((script) => {
      try {
        const data = JSON.parse(script.textContent || "{}");
        if (Array.isArray(data["@graph"])) return data["@graph"].map((item: { "@type"?: string }) => item["@type"]);
        return [data["@type"]];
      } catch {
        return [];
      }
    }),
  );
}

test("homepage emits a large social card and site identity schema", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /opengraph-image/);

  const types = await jsonLdTypes(page);
  expect(types).toContain("Organization");
  expect(types).toContain("WebSite");
});

test("directory, near, best-for, and tonight hubs emit collection schema", async ({ page }) => {
  for (const path of ["/las-vegas-hotels", "/near/sphere", "/best/bachelor-party", "/tonight"]) {
    await page.goto(path);
    expect(await jsonLdTypes(page), `${path} should identify its collection`).toContain("CollectionPage");
  }
});

test("titles use the site template once and sitemap includes the complete topical map", async ({ page, request }) => {
  await page.goto("/las-vegas-hotels");
  expect(await page.title()).toBe("Las Vegas Hotels | ExperienceVegas");
  expect(await page.title()).not.toContain("ExperienceVegas | ExperienceVegas");

  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const sitemap = await response.text();
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(urls.length).toBeGreaterThan(80);
  expect(new Set(urls).size).toBe(urls.length);
});
