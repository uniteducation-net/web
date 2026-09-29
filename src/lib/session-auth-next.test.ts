import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  // session.ts derives its key lazily (per call), so stubbing here — after
  // the hoisted imports — is fine. 32 bytes as hex, same as production.
  vi.stubEnv("SESSION_SECRET", "a".repeat(64));
});

import {
  sanitizeNext,
  sealAuthNext,
  unsealAuthNext,
} from "@/lib/session";

describe("sanitizeNext", () => {
  it("keeps same-site paths", () => {
    expect(sanitizeNext("/workspace/template")).toBe("/workspace/template");
    expect(sanitizeNext("/workspace")).toBe("/workspace");
  });

  it("rejects absolute URLs and protocol-relative paths", () => {
    expect(sanitizeNext("https://evil.example")).toBe("/workspace");
    expect(sanitizeNext("//evil.example")).toBe("/workspace");
  });

  it("falls back for missing or relative values", () => {
    expect(sanitizeNext(null)).toBe("/workspace");
    expect(sanitizeNext(undefined)).toBe("/workspace");
    expect(sanitizeNext("")).toBe("/workspace");
    expect(sanitizeNext("workspace")).toBe("/workspace");
  });
});

describe("auth_next seal/unseal", () => {
  it("round-trips a next path", async () => {
    const sealed = await sealAuthNext("/workspace/auth-complete");
    await expect(unsealAuthNext(sealed)).resolves.toBe(
      "/workspace/auth-complete",
    );
  });

  it("rejects garbage and tampered values", async () => {
    await expect(unsealAuthNext("not-a-jwt")).resolves.toBeNull();
    const sealed = await sealAuthNext("/workspace");
    const tampered = `${sealed.slice(0, -2)}${sealed.endsWith("aa") ? "bb" : "aa"}`;
    await expect(unsealAuthNext(tampered)).resolves.toBeNull();
  });

  it("rejects an expired cookie", async () => {
    vi.useFakeTimers();
    try {
      const sealed = await sealAuthNext("/workspace");
      vi.advanceTimersByTime(11 * 60 * 1000); // past the 10-minute TTL
      await expect(unsealAuthNext(sealed)).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
