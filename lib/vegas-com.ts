/**
 * vegas.com affiliate links, served through impact.com.
 *
 * The tracking link is `/c/<publisherId>/<campaignId>/<adId>`. It is not a
 * secret: it ships in the page source of every affiliate site that uses it.
 *
 * Deep linking is enabled on this program, so `u=` sends the visitor to a
 * specific vegas.com page instead of the program's default landing page. The
 * value must be percent-encoded, and the brand only honors destinations on
 * paths it permits, so an unrecognized path lands on the default page rather
 * than 404ing.
 */

export const VEGAS_COM_TRACKING_LINK = "https://vegas.vdvm.net/c/3676661/260030/4221";

const VEGAS_COM_ORIGIN = "https://www.vegas.com";

/**
 * impact.com accepts letters and numbers only in subId values, up to 255
 * characters. Our slugs carry hyphens, so they are stripped rather than passed
 * through and silently dropped by the network.
 */
export function vegasComSubId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 255);
}

/**
 * Resolves a destination to an absolute vegas.com URL, or undefined when there
 * is nothing safe to deep link to.
 *
 * Only vegas.com destinations are accepted. An absolute URL pointing elsewhere
 * is refused rather than forwarded: the brand's allowlist would reject it, and
 * passing arbitrary URLs through our own links is how an affiliate link turns
 * into an open redirect.
 */
export function vegasComDestination(path?: string) {
  const value = path?.trim();
  if (!value) return undefined;

  if (/^https?:\/\//i.test(value)) {
    return /^https:\/\/(www\.)?vegas\.com(\/|$)/i.test(value) ? value : undefined;
  }

  return `${VEGAS_COM_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

/**
 * Builds a tracking link.
 *
 * `path` deep links to a vegas.com page; omit it to use the program's default
 * landing page, which is still a working affiliate link.
 * `placement` tags the click so reporting shows which surface converts.
 */
export function vegasComLink({ path, placement }: { path?: string; placement?: string } = {}) {
  const params: string[] = [];
  const destination = vegasComDestination(path);

  // encodeURIComponent rather than URLSearchParams: the latter encodes spaces
  // as "+", which a destination URL cannot carry safely.
  if (destination) params.push(`u=${encodeURIComponent(destination)}`);

  if (placement) {
    const subId = vegasComSubId(placement);
    if (subId) params.push(`subId1=${subId}`);
  }

  return params.length > 0 ? `${VEGAS_COM_TRACKING_LINK}?${params.join("&")}` : VEGAS_COM_TRACKING_LINK;
}
