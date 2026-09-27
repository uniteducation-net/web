// Consent record for the cookie banner — the single source of truth every
// consent-gated feature reads from.
//
// Categories:
// - essential — always on, never stored: the session/oauth_state/fu cookies,
//   the BotID security challenge, and this consent cookie itself.
// - analytics — gates Vercel Analytics events (see consent-analytics.tsx).
// - external — GENERAL bucket for ALL third-party content. Every embed that
//   phones a third party (YouTube facade on the homepage, Tally forms on the
//   join pages, and any future embed) MUST check this category before
//   loading. Click-to-load placeholders grant it for the session via
//   grantExternalForSession (a deliberate click = consenting to that
//   content). The one deliberate exception: the feedback button loads Tally
//   only on click — user-initiated by design (see feedback-button.tsx).
//
// Storage: a `ue_consent` cookie (JSON, Path=/ so all root layouts share it,
// 180 days, SameSite=Lax). A cookie rather than localStorage so the record
// expires as regulators expect. Bump CONSENT_VERSION when the categories
// change — old records are then treated as undecided and the banner re-asks.

import { useSyncExternalStore } from "react";

const CONSENT_COOKIE = "ue_consent";
const CONSENT_VERSION = 1;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export interface ConsentChoices {
  analytics: boolean;
  external: boolean;
}

export interface ConsentState extends ConsentChoices {
  /** false until the visitor has accepted, rejected, or saved once. */
  decided: boolean;
  /** UI-only flag: the footer's "Cookie settings" entry re-opens the banner. */
  settingsOpen: boolean;
}

const DEFAULT_STATE: ConsentState = {
  decided: false,
  analytics: false,
  external: false,
  settingsOpen: false,
};

const readRecord = (): Pick<ConsentState, "decided" | "analytics" | "external"> => {
  const fallback = { decided: false, analytics: false, external: false };
  if (typeof document === "undefined") return fallback;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!raw) return fallback;
  try {
    const record = JSON.parse(decodeURIComponent(raw)) as {
      v?: number;
      analytics?: boolean;
      external?: boolean;
    };
    // Unknown/old format: treat as never asked — the banner re-prompts.
    if (record.v !== CONSENT_VERSION) return fallback;
    return {
      decided: true,
      analytics: record.analytics === true,
      external: record.external === true,
    };
  } catch {
    return fallback;
  }
};

const writeRecord = (choices: ConsentChoices) => {
  const value = encodeURIComponent(
    JSON.stringify({ v: CONSENT_VERSION, ...choices }),
  );
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
};

// Evaluated once per environment: the server render gets DEFAULT_STATE, the
// client bundle reads the stored record before the first render.
let state: ConsentState =
  typeof document === "undefined"
    ? DEFAULT_STATE
    : { ...DEFAULT_STATE, ...readRecord() };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

const update = (patch: Partial<ConsentState>) => {
  state = { ...state, ...patch };
  emit();
};

export const getConsent = (): Pick<
  ConsentState,
  "decided" | "analytics" | "external"
> => ({ decided: state.decided, analytics: state.analytics, external: state.external });

/** Persists the choices and closes the banner (also after footer re-open). */
export const setConsent = (choices: ConsentChoices) => {
  writeRecord(choices);
  update({ ...choices, decided: true, settingsOpen: false });
};

export const acceptAll = () => setConsent({ analytics: true, external: true });
export const rejectAll = () => setConsent({ analytics: false, external: false });

/**
 * Session-scoped grant of the external-content category, for click-to-load
 * placeholders. Deliberately does NOT write the cookie or mark the choice as
 * decided: the banner keeps asking until the visitor explicitly accepts,
 * rejects, or saves — no implicit decisions get persisted.
 */
export const grantExternalForSession = () => update({ external: true });

/** Re-opens the banner even though a choice was already recorded. */
export const requestConsentSettings = () => update({ settingsOpen: true });

export const subscribeConsent = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = (): ConsentState => state;
const getServerSnapshot = (): ConsentState => DEFAULT_STATE;

/** Reactive consent state. Renders the undecided default on the server and
 * during hydration, then swaps to the stored record — so the banner never
 * flashes for visitors who already chose. */
export const useConsent = (): ConsentState =>
  useSyncExternalStore(subscribeConsent, getSnapshot, getServerSnapshot);
