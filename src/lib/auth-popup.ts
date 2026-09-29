// Popup connect flow — the main page NEVER navigates to GitHub. Consent
// (authorize / install / coverage approval — GitHub requires its own UI, an
// iframe modal is impossible because GitHub denies framing) happens in a
// small centered popup window. The chain ends on /workspace/auth-complete,
// which postMessages the opener and closes itself; the opener then re-checks
// /api/auth/status — the message is a hint, the session cookie is the truth.
//
// Client-safe module (no server-only imports) — used by client components.

export const AUTH_COMPLETE_PATH = "/workspace/auth-complete";
export const AUTH_COMPLETE_MESSAGE = "github-auth-complete";

/** Mirrors the /api/auth/status payload (session fields, client-side copy). */
export interface AuthStatus {
  authenticated: boolean;
  user?: { login: string; name: string | null; avatarUrl: string };
  installationId?: number | null;
  repo?: { owner: string; name: string } | null;
}

/** Full-page auth entry — the plain-anchor / no-JS / middle-click /
 *  blocked-popup path. Identical to the pre-popup behavior. */
export function authStartUrl(next: string): string {
  return `/api/auth/github?next=${encodeURIComponent(next)}`;
}

export type PopupOutcome =
  /** The auth-complete page messaged us (origin-checked). */
  | "completed"
  /** The window closed without completing — user bail, or a cross-origin
      page (the coverage fix on github.com) that cannot message us. */
  | "aborted"
  /** The browser refused the popup — caller falls back to full-page nav. */
  | "blocked";

/**
 * Open a URL in the small auth window. MUST be called synchronously from a
 * click handler — awaiting anything first loses transient activation and the
 * browser blocks the popup. The window is named, so a second legitimate click
 * reuses and raises the existing one instead of stacking.
 */
export function openPopup(url: string): Promise<PopupOutcome> {
  const popup = window.open(url, "github-auth", "width=600,height=720,popup");
  if (!popup) return Promise.resolve("blocked");
  popup.focus();
  return new Promise((resolve) => {
    const cleanup = () => {
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data !== AUTH_COMPLETE_MESSAGE) return;
      cleanup();
      resolve("completed");
    };
    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve("aborted");
      }
    }, 500);
    window.addEventListener("message", onMessage);
  });
}

/** The OAuth chain; on completion it always lands on the auto-close page. */
export function openAuthPopup(): Promise<PopupOutcome> {
  return openPopup(authStartUrl(AUTH_COMPLETE_PATH));
}

/** Server truth after any popup outcome. Never throws. */
export async function fetchAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch("/api/auth/status", { cache: "no-store" });
    if (!res.ok) return { authenticated: false };
    return (await res.json()) as AuthStatus;
  } catch {
    return { authenticated: false };
  }
}

export type ConnectResult =
  | { outcome: "connected"; status: AuthStatus }
  | { outcome: "aborted" }
  | { outcome: "blocked" };

/** One-call connect used by every CTA: popup → status re-check. */
export async function connectGitHub(): Promise<ConnectResult> {
  // window.open fires synchronously inside openPopup — see its comment.
  const outcome = await openAuthPopup();
  if (outcome === "blocked") return { outcome: "blocked" };
  const status = await fetchAuthStatus();
  return status.authenticated
    ? { outcome: "connected", status }
    : { outcome: "aborted" };
}

// ---------------------------------------------------------------------------
// Unload-prompt suppression. The template workspace's beforeunload guard
// (anonymous draft warning) is a FALSE positive for intentional full-page
// hops: the auth-chain fallback (the draft survives in localStorage) and the
// post-create navigation (the draft was just converted into the repo). Those
// paths flag the next unload; the guard consumes the flag and stays quiet.
// Module-level is enough — the flag is set synchronously before a full-page
// navigation in the same window.
// ---------------------------------------------------------------------------

let unloadPromptSuppressed = false;

export function suppressNextUnloadPrompt(): void {
  unloadPromptSuppressed = true;
}

/** Read-and-reset: one suppression covers exactly one beforeunload. */
export function consumeUnloadPromptSuppression(): boolean {
  const was = unloadPromptSuppressed;
  unloadPromptSuppressed = false;
  return was;
}
