// The create route's error payload → teacher-facing copy, shared by the
// onboarding screen and the template workspace's conversion CTA (17) so the
// two never drift. Client-safe, dependency-free.
// Plan: docs/plans/icm-workspace-plan/17-template-workspace.md

export interface CreateErrorCopy {
  message: string;
  /** True when only re-authorization fixes it — the UI offers a reconnect. */
  reconnect?: boolean;
}

export function describeCreateError(data: {
  error?: string;
  message?: string;
}): CreateErrorCopy {
  switch (data.error) {
    case "github_reauthorization_needed":
      return {
        message:
          "GitHub needs updated permissions — reconnect your account to continue.",
        reconnect: true,
      };
    case "github_region_blocked":
      return {
        message:
          "GitHub is unavailable in your region, so we can't create your workspace right now.",
      };
    case "github_unavailable":
      return {
        message:
          "GitHub is having trouble right now — please try again in a moment.",
      };
    case "app_not_installed":
      return {
        message:
          "GitHub isn't fully connected yet — press the button again to reconnect.",
      };
    case "not_authenticated":
      return {
        message:
          "Log in with GitHub to continue — one small window, then you're back here.",
        reconnect: true,
      };
    case "installation_not_covering_repo":
      // Shown when the coverage-fix round-trip already ran once (a second
      // consecutive 409) — the generic copy would be misleading.
      return {
        message:
          "GitHub hasn't granted access to the new workspace yet — press the button again to retry.",
      };
    default:
      return {
        message:
          data.message ??
          "Something went wrong while creating your workspace — please try again.",
      };
  }
}
