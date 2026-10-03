import { describe, expect, it } from "vitest";
import { RequestError } from "octokit";
import { isInstallationGoneError } from "@/lib/github";

// A deleted (404) or suspended (403) installation surfaces as an IAT-mint
// failure on ANY repo op with a stale session.installationId — detected by
// the mint request URL so a plain repo 404 is never misclassified.

const MINT_URL =
  "https://api.github.com/app/installations/167479663/access_tokens";
const REPO_URL = "https://api.github.com/repos/teacher/UnitEd-Workspace";

function err(status: number, url: string): RequestError {
  return new RequestError("request failed", status, {
    request: { method: "GET", url, headers: {} },
  });
}

describe("isInstallationGoneError", () => {
  it("404 on the access_tokens mint = deleted installation", () => {
    expect(isInstallationGoneError(err(404, MINT_URL))).toBe(true);
  });

  it("403 on the access_tokens mint = suspended installation", () => {
    expect(isInstallationGoneError(err(403, MINT_URL))).toBe(true);
  });

  it("404 on a repo route = repo gone, NOT installation gone", () => {
    expect(isInstallationGoneError(err(404, REPO_URL))).toBe(false);
  });

  it("401 on the mint = broken app credentials — must stay a loud 500", () => {
    expect(isInstallationGoneError(err(401, MINT_URL))).toBe(false);
  });

  it("5xx and non-RequestErrors are never installation-gone", () => {
    expect(isInstallationGoneError(err(500, MINT_URL))).toBe(false);
    expect(isInstallationGoneError(new Error("nope"))).toBe(false);
    expect(isInstallationGoneError(null)).toBe(false);
  });
});
