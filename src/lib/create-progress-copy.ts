// The creation chain (connect → create → seed → open) can take up to a
// minute — these stages drive the full-screen progress overlay so a
// non-technical teacher always sees what is happening. Client-safe,
// dependency-free (same posture as create-error.ts).

export type CreateStage = "connecting" | "creating" | "seeding" | "opening";

/** Stage → teacher-facing line. Unit-tested. */
export function createStageCopy(stage: CreateStage): string {
  switch (stage) {
    case "connecting":
      return "Connecting GitHub…";
    case "creating":
      return "Creating your private workspace…";
    case "seeding":
      return "Writing your first files…";
    case "opening":
      return "Opening your workspace…";
  }
}
