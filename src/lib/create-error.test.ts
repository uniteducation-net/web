import { describe, expect, it } from "vitest";
import { describeCreateError } from "./create-error";

// The create route's error payload → teacher-facing copy. The onboarding
// screen and the template workspace share this mapping — drift between them
// is what these assertions guard against.

describe("describeCreateError", () => {
  it("maps github_reauthorization_needed with a reconnect flag", () => {
    expect(
      describeCreateError({ error: "github_reauthorization_needed" }),
    ).toEqual({
      message:
        "GitHub needs updated permissions — reconnect your account to continue.",
      reconnect: true,
    });
  });

  it("maps not_authenticated with a reconnect flag", () => {
    expect(describeCreateError({ error: "not_authenticated" })).toEqual({
      message:
        "Log in with GitHub to continue — one small window, then you're back here.",
      reconnect: true,
    });
  });

  it("maps installation_not_covering_repo without a reconnect flag", () => {
    const copy = describeCreateError({
      error: "installation_not_covering_repo",
    });
    expect(copy.message).toContain("hasn't granted access");
    expect(copy.reconnect).toBeUndefined();
  });

  it("maps github_region_blocked", () => {
    expect(
      describeCreateError({ error: "github_region_blocked" }).message,
    ).toContain("unavailable in your region");
  });

  it("maps github_unavailable", () => {
    expect(
      describeCreateError({ error: "github_unavailable" }).message,
    ).toContain("having trouble");
  });

  it("maps app_not_installed", () => {
    expect(
      describeCreateError({ error: "app_not_installed" }).message,
    ).toContain("isn't fully connected");
  });

  it("prefers a server-provided message for unknown errors", () => {
    expect(
      describeCreateError({ error: "weird", message: "Server said this." }),
    ).toEqual({ message: "Server said this." });
  });

  it("falls back to the generic copy", () => {
    expect(describeCreateError({}).message).toContain("Something went wrong");
  });
});
