import { track } from "@vercel/analytics";

type ProductEventDetails = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Vercel Analytics rejects undefined property values, and sending them would
 * drop the whole event rather than the one field.
 */
function definedProperties(details: ProductEventDetails) {
  return Object.fromEntries(
    Object.entries(details).filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined),
  );
}

/**
 * Sends one product event to every destination that is configured.
 *
 * This used to push only into window.dataLayer, which nothing ever created, so
 * the optional chain silently discarded every event the app has ever fired.
 * Two sinks now exist, and neither depends on the other:
 *
 * - Vercel Analytics, which needs no configuration at all
 * - GTM, whenever NEXT_PUBLIC_GTM_ID is set, which creates dataLayer for real
 *
 * The CustomEvent stays for tests and for anything listening in the page.
 */
export function trackProductEvent(event: string, details: ProductEventDetails = {}) {
  if (typeof window === "undefined") return;

  const properties = definedProperties(details);

  // Never let an analytics failure break the interaction that triggered it.
  try {
    track(event, properties);
  } catch {
    // Ignored on purpose: a blocked or unavailable collector is not an error
    // the visitor should ever experience.
  }

  // Created here rather than assumed: an event fired before the GTM container
  // loads must queue, not vanish. That silent vanishing is the bug this
  // module shipped with.
  (window.dataLayer = window.dataLayer || []).push({ event, ...properties });
  window.dispatchEvent(new CustomEvent("experiencevegas:analytics", { detail: { event, ...properties } }));
}
