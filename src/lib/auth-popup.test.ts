// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_COMPLETE_MESSAGE,
  authStartUrl,
  connectGitHub,
  consumeUnloadPromptSuppression,
  fetchAuthStatus,
  openPopup,
  suppressNextUnloadPrompt,
} from "./auth-popup";

// The popup contract: window.open must fire synchronously, the postMessage
// is origin-checked, the closed-poll detects bails, and every outcome is
// re-checked against /api/auth/status.

type FakePopup = { closed: boolean; focus: () => void };

function stubOpen(result: FakePopup | null) {
  const fn = vi.fn(() => result);
  window.open = fn as unknown as typeof window.open;
  return fn;
}

function dispatchAuthMessage(origin: string, data: unknown) {
  window.dispatchEvent(new MessageEvent("message", { data, origin }));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("authStartUrl", () => {
  it("encodes the next path", () => {
    expect(authStartUrl("/workspace/template")).toBe(
      "/api/auth/github?next=%2Fworkspace%2Ftemplate",
    );
  });
});

describe("openPopup", () => {
  it('resolves "blocked" when the browser refuses the popup', async () => {
    const open = stubOpen(null);
    await expect(openPopup("/x")).resolves.toBe("blocked");
    expect(open).toHaveBeenCalledOnce();
  });

  it('resolves "completed" on the origin-checked auth message', async () => {
    const popup: FakePopup = { closed: false, focus: vi.fn() };
    stubOpen(popup);
    const promise = openPopup("/x");
    dispatchAuthMessage(window.location.origin, AUTH_COMPLETE_MESSAGE);
    await expect(promise).resolves.toBe("completed");
  });

  it("ignores messages from other origins or with other data", async () => {
    const popup: FakePopup = { closed: false, focus: vi.fn() };
    stubOpen(popup);
    const promise = openPopup("/x");
    dispatchAuthMessage("https://evil.example", AUTH_COMPLETE_MESSAGE);
    dispatchAuthMessage(window.location.origin, "something-else");
    // Nothing resolved — closing the window is what ends it.
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toBe("aborted");
  });

  it('resolves "aborted" when the window closes without a message', async () => {
    const popup: FakePopup = { closed: false, focus: vi.fn() };
    stubOpen(popup);
    const promise = openPopup("/x");
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toBe("aborted");
  });
});

describe("fetchAuthStatus", () => {
  it("returns the parsed payload on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ authenticated: true, installationId: 42 }),
      })),
    );
    const status = await fetchAuthStatus();
    expect(status).toEqual({ authenticated: true, installationId: 42 });
  });

  it("returns unauthenticated on HTTP failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    await expect(fetchAuthStatus()).resolves.toEqual({
      authenticated: false,
    });
  });

  it("returns unauthenticated on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    await expect(fetchAuthStatus()).resolves.toEqual({
      authenticated: false,
    });
  });
});

describe("connectGitHub", () => {
  it("short-circuits to blocked without calling status", async () => {
    stubOpen(null);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(connectGitHub()).resolves.toEqual({ outcome: "blocked" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports connected when status confirms the session", async () => {
    const popup: FakePopup = { closed: false, focus: vi.fn() };
    stubOpen(popup);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ authenticated: true }),
      })),
    );
    const promise = connectGitHub();
    dispatchAuthMessage(window.location.origin, AUTH_COMPLETE_MESSAGE);
    await expect(promise).resolves.toEqual({
      outcome: "connected",
      status: { authenticated: true },
    });
  });

  it("reports aborted when the window closed and status says logged out", async () => {
    const popup: FakePopup = { closed: false, focus: vi.fn() };
    stubOpen(popup);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ authenticated: false }),
      })),
    );
    const promise = connectGitHub();
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toEqual({ outcome: "aborted" });
  });
});

describe("unload-prompt suppression", () => {
  it("consumes exactly once", () => {
    expect(consumeUnloadPromptSuppression()).toBe(false);
    suppressNextUnloadPrompt();
    expect(consumeUnloadPromptSuppression()).toBe(true);
    expect(consumeUnloadPromptSuppression()).toBe(false);
  });
});
