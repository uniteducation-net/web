import { describe, expect, it } from "vitest";
import { createStageCopy, type CreateStage } from "@/lib/create-progress-copy";

// Every stage must have teacher-facing copy — the overlay renders this
// verbatim for up to a minute.

describe("createStageCopy", () => {
  it("covers all stages with non-empty copy", () => {
    const stages: CreateStage[] = [
      "connecting",
      "creating",
      "seeding",
      "opening",
    ];
    for (const stage of stages) {
      expect(createStageCopy(stage).length).toBeGreaterThan(0);
    }
  });

  it("never exposes technical terms", () => {
    const stages: CreateStage[] = [
      "connecting",
      "creating",
      "seeding",
      "opening",
    ];
    for (const stage of stages) {
      expect(createStageCopy(stage)).not.toMatch(/repo|token|API|install/i);
    }
  });
});
