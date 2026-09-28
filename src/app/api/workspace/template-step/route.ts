// Anonymous step-1 generation for the template workspace (17 step 4): the
// EXACT provisioning pipeline (evaluateProfile → pickResource →
// buildStepFiles) minus persistence — the teacher sees a real first step in
// their local draft before deciding to log in. No session by design;
// protection is BotID + the profile schema's caps + the shared fair-use
// cookie, and every "can't personalize" answer is a terminal { files: [] }
// (the client keeps the empty step placeholder and stops asking).
// Plan: docs/plans/icm-workspace-plan/17-template-workspace.md

import { NextResponse } from "next/server";
import { teacherProfileSchema } from "@/lib/onboarding";
import { buildStepFiles } from "@/lib/provisioning";
import {
  evaluateProfile,
  fallbackEvaluation,
  pickResource,
} from "@/lib/evaluation";
import { getResourcesIndex } from "@/lib/resources";
import { hasEnoughProfileData } from "@/lib/template-workspace";
import {
  FREE_TIER_DAILY_TOKEN_LIMIT,
  addFairUseTokens,
  getFairUse,
} from "@/lib/fair-use";
import { isBotRequest } from "@/lib/botid";

// One (small) Jev evaluation + a possible provider-excerpt fetch.
export const maxDuration = 60;

export async function POST(req: Request) {
  if (await isBotRequest()) {
    return NextResponse.json({ error: "access_denied" }, { status: 403 });
  }

  let profile;
  try {
    const body = (await req.json()) as { profile?: unknown };
    const parsed = teacherProfileSchema.safeParse(body?.profile);
    if (!parsed.success) throw new Error("invalid profile");
    profile = parsed.data;
  } catch {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }

  // "Enough data" gate (17 step 4): a name plus at least two other answers —
  // below that a "personalized" step is a coin flip, so the template keeps
  // its empty step folder instead.
  if (!hasEnoughProfileData(profile)) {
    return NextResponse.json({ files: [], reason: "not_enough_profile" });
  }

  const resourceIndex = await getResourcesIndex();
  if (!resourceIndex || resourceIndex.length === 0) {
    return NextResponse.json({ files: [], reason: "no_resources" });
  }

  // Same fair-use gate as provisioning (07 step 8c): the LLM spends the
  // NGO's free tier, so over-ceiling (or keyless) runs the deterministic
  // fallback category instead.
  const fu = await getFairUse();
  const evaluation =
    process.env.AI_GATEWAY_API_KEY && fu.tokens < FREE_TIER_DAILY_TOKEN_LIMIT
      ? await evaluateProfile(profile)
      : fallbackEvaluation();

  const resource = pickResource(evaluation, resourceIndex);
  if (!resource) {
    return NextResponse.json({ files: [], reason: "no_resource" });
  }

  const files = await buildStepFiles({
    stepNumber: 1,
    folderNumber: 2,
    resource,
    evaluation,
  });
  // Meter only real LLM spend (fallback returns usageTokens 0). Legal here —
  // a plain JSON route can still set cookies.
  if (evaluation.usageTokens > 0) await addFairUseTokens(evaluation.usageTokens);

  return NextResponse.json({ files });
}
