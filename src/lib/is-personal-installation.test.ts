import { describe, expect, it } from "vitest";
import { isPersonalInstallation } from "@/lib/github";

// Workspace repos live in the teacher's personal account — the /installed
// route must refuse to bind org (or otherwise foreign) installations into
// session.installationId.

describe("isPersonalInstallation", () => {
  it("accepts the installation on the user's own account", () => {
    expect(
      isPersonalInstallation(
        { id: 1, account: { login: "kiarash-na" } },
        "kiarash-na",
      ),
    ).toBe(true);
  });

  it("rejects an organization installation", () => {
    expect(
      isPersonalInstallation(
        { id: 2, account: { login: "uniteducation-net" } },
        "kiarash-na",
      ),
    ).toBe(false);
  });

  it("rejects a different user's installation", () => {
    expect(
      isPersonalInstallation({ id: 3, account: { login: "someone" } }, "kiarash-na"),
    ).toBe(false);
  });

  it("rejects a null account (defensive — the field is nullable)", () => {
    expect(isPersonalInstallation({ id: 4, account: null }, "kiarash-na")).toBe(
      false,
    );
  });
});
