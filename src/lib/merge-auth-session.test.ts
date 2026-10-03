import { describe, expect, it } from "vitest";
import {
  mergeAuthSession,
  type AuthSessionFields,
  type Session,
} from "@/lib/session";

// The OAuth callback must merge fresh auth fields into the existing session —
// never wholesale-replace it. A replace clobbers `repo`/BYOK state written by
// concurrent requests (the popup flow hits the callback twice), which stranded
// the workspace APIs on 409 no_workspace.

const auth: AuthSessionFields = {
  user: { login: "teacher", name: "Teacher", avatarUrl: "https://x" },
  userToken: "new-token",
  userTokenExpiresAt: 999,
  refreshToken: "new-refresh",
  installationId: 42,
};

const existing: Session = {
  user: { login: "teacher", name: "Teacher", avatarUrl: "https://x" },
  userToken: "old-token",
  userTokenExpiresAt: 111,
  refreshToken: "old-refresh",
  installationId: 7,
  repo: { owner: "teacher", name: "UnitEd-Workspace" },
  byokProvider: "anthropic",
  byokKey: "sk-key",
  model: "some-model",
};

describe("mergeAuthSession", () => {
  it("same login: preserves repo and settings, rotates tokens and installation", () => {
    const merged = mergeAuthSession(existing, auth);
    expect(merged.userToken).toBe("new-token");
    expect(merged.refreshToken).toBe("new-refresh");
    expect(merged.installationId).toBe(42);
    expect(merged.repo).toEqual({ owner: "teacher", name: "UnitEd-Workspace" });
    expect(merged.byokKey).toBe("sk-key");
    expect(merged.model).toBe("some-model");
  });

  it("same login, installation not found this leg: drops the stale id, keeps repo", () => {
    const { installationId: _omit, ...noInstall } = auth;
    const merged = mergeAuthSession(existing, noInstall);
    expect(merged.installationId).toBeUndefined();
    expect(merged.repo).toEqual({ owner: "teacher", name: "UnitEd-Workspace" });
  });

  it("different login (account switch): fresh object — no repo or keys leak", () => {
    const merged = mergeAuthSession(existing, {
      ...auth,
      user: { login: "someone-else", name: null, avatarUrl: "https://y" },
    });
    expect(merged.repo).toBeUndefined();
    expect(merged.byokKey).toBeUndefined();
    expect(merged.byokProvider).toBeUndefined();
    expect(merged.userToken).toBe("new-token");
  });

  it("no existing session: returns the auth fields as-is", () => {
    const merged = mergeAuthSession(null, auth);
    expect(merged).toEqual({ ...auth });
  });
});
