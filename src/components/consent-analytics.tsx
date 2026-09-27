"use client";

import { Analytics } from "@vercel/analytics/next";

import { getConsent } from "@/lib/consent";

/**
 * Vercel Analytics gated by the "analytics" consent category. beforeSend runs
 * at send time for every event, so reading the live consent record makes both
 * granting AND revoking take effect immediately — without remounting or
 * reloading (Vercel's documented opt-out pattern). The script asset itself is
 * same-origin in production (/_vercel/insights/*); it just never emits.
 */
const ConsentAnalytics = () => (
  <Analytics beforeSend={(event) => (getConsent().analytics ? event : null)} />
);

export { ConsentAnalytics };
