// 12 step 5 — the entire "settings backend": merge the posted change into the
// session object and re-encrypt the cookie via setSession (02). No database —
// the cookie is the store. Keys are write-only: they are never returned here,
// never logged, and never reach the UI beyond the last 4 characters.
// Plan: docs/plans/icm-workspace-plan/12-settings.md

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, setSession, type Session } from "@/lib/session";
import { GitHubRateLimitError, listAccessibleRepos } from "@/lib/github";
import {
  addFairUseTokens,
  getFairUse,
  FREE_TIER_DAILY_TOKEN_LIMIT,
} from "@/lib/fair-use";
import {
  activeProvider,
  modelOptionsFor,
  resolveModelId,
} from "@/lib/llm";

const postSchema = z.union([
  z.object({
    byokProvider: z.enum(["openai", "anthropic", "google"]),
    byokKey: z.string().min(8).max(512),
  }),
  z.object({ clearByok: z.literal(true) }),
  z.object({ openrouterKey: z.string().min(8).max(512) }),
  z.object({ clearOpenrouter: z.literal(true) }),
  z.object({ model: z.string().min(1).max(200) }),
  z.object({
    repo: z.object({
      owner: z.string().min(1).max(100),
      name: z.string().min(1).max(100),
    }),
  }),
  z.object({ usageTokens: z.number().int().min(0).max(1_000_000) }),
]);

/**
 * The client-safe settings view. `provider` mirrors the resolution order in
 * lib/llm.ts (13): an OpenRouter key wins over a BYOK key, which wins over
 * the gateway free tier. Keys are reduced to their last 4 characters.
 * `model`/`modelOptions` feed the tiny curated picker (13 step 3).
 */
async function settingsView(session: Session) {
  const fairUse = await getFairUse();
  return {
    provider: activeProvider(session),
    byokProvider: session.byokKey ? (session.byokProvider ?? null) : null,
    byokKeyLast4: session.byokKey ? session.byokKey.slice(-4) : null,
    model: resolveModelId(session),
    modelOptions: modelOptionsFor(session),
    fairUse: { tokens: fairUse.tokens, limit: FREE_TIER_DAILY_TOKEN_LIMIT },
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  return NextResponse.json(await settingsView(session));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if ("usageTokens" in body) {
    // 12 step 6 — the agent reports its token usage (it streams, so it can't
    // set cookies itself); the fair-use counter is the only state to update.
    const fairUse = await addFairUseTokens(body.usageTokens);
    return NextResponse.json({
      fairUse: { tokens: fairUse.tokens, limit: FREE_TIER_DAILY_TOKEN_LIMIT },
    });
  }

  if ("repo" in body) {
    // 12 step 3 — switching workspace is just a cookie update: instant and
    // reversible. Only repos the installation covers are accepted (the picker
    // lists the same set), so a typo'd or foreign repo can never be set.
    if (!session.installationId) {
      return NextResponse.json({ error: "no_installation" }, { status: 409 });
    }
    let match: { owner: string; name: string } | undefined;
    try {
      const repos = await listAccessibleRepos(session.installationId);
      match = repos.find(
        (r) => r.owner === body.repo.owner && r.name === body.repo.name,
      );
    } catch (err) {
      if (err instanceof GitHubRateLimitError) {
        return NextResponse.json(
          { error: "github_rate_limited", message: err.message },
          { status: 503 },
        );
      }
      console.error("settings repo-switch failed:", err);
      return NextResponse.json({ error: "repo_check_failed" }, { status: 500 });
    }
    if (!match) {
      return NextResponse.json(
        { error: "repo_not_accessible" },
        { status: 404 },
      );
    }
    await setSession({ ...session, repo: { owner: match.owner, name: match.name } });
    return NextResponse.json(await settingsView({ ...session, repo: match }));
  }

  if ("model" in body) {
    // 13 step 3 — the picker is curated: only models from the active
    // provider's tiny list (lib/llm.ts) are accepted.
    if (!modelOptionsFor(session).includes(body.model)) {
      return NextResponse.json({ error: "unknown_model" }, { status: 400 });
    }
    const next: Session = { ...session, model: body.model };
    await setSession(next);
    return NextResponse.json(await settingsView(next));
  }

  // Provider mutations. Saving one key clears the other so the radio choice
  // in Settings maps 1:1 onto what /api/agent uses (13's resolution order).
  // The model choice is reset too — curated lists differ per provider.
  const next: Session = { ...session };
  delete next.model;
  if ("byokKey" in body) {
    next.byokProvider = body.byokProvider;
    next.byokKey = body.byokKey;
    delete next.openrouterKey;
  } else if ("clearByok" in body) {
    delete next.byokProvider;
    delete next.byokKey;
  } else if ("openrouterKey" in body) {
    next.openrouterKey = body.openrouterKey;
    delete next.byokProvider;
    delete next.byokKey;
  } else {
    delete next.openrouterKey; // clearOpenrouter
  }
  await setSession(next);
  return NextResponse.json(await settingsView(next));
}
