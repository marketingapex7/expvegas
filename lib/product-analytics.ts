type ProductEventDetails = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function trackProductEvent(event: string, details: ProductEventDetails = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer?.push({ event, ...details });
  window.dispatchEvent(new CustomEvent("experiencevegas:analytics", { detail: { event, ...details } }));
}
