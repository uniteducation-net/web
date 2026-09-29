import { describe, expect, it } from "vitest";
import { parseWorkspaceTemplateEnv } from "@/lib/github";

// The env gate for the installation-token creation path: anything but a
// clean "owner/repo" leaves the primary path dormant (byte-identical
// fallback behavior).

describe("parseWorkspaceTemplateEnv", () => {
  it("parses a clean owner/repo", () => {
    expect(parseWorkspaceTemplateEnv("uniteducation-net/workspace-template"))
      .toEqual({ owner: "uniteducation-net", repo: "workspace-template" });
  });

  it("returns null when unset or empty", () => {
    expect(parseWorkspaceTemplateEnv(undefined)).toBeNull();
    expect(parseWorkspaceTemplateEnv("")).toBeNull();
  });

  it("returns null for malformed values", () => {
    expect(parseWorkspaceTemplateEnv("no-slash")).toBeNull();
    expect(parseWorkspaceTemplateEnv("too/many/slashes")).toBeNull();
    expect(parseWorkspaceTemplateEnv("/repo")).toBeNull();
    expect(parseWorkspaceTemplateEnv("owner/")).toBeNull();
  });
});
