# 17 — Template Workspace (anonymous local draft)

Status: shipped 2026-09-28. Supersedes the `/workspace/demo` mock (retired to a redirect).

## Goal

The workspace area opens for **everyone** — no GitHub account needed to see
it. The top-right "Go to workspace" button (onboarding) and the resources
"Open a blank template" card both land on `/workspace/template`: the real
editor over a localStorage draft with the minimal ICM skeleton. Logging in
converts the draft **WYSIWYG** into the teacher's private repo.

## Route map

```
/workspace           → unchanged guard (repo → shell, else /workspace/start)
/workspace/template  → NEW: all auth states render, banner CTA differs
/workspace/demo      → next.config redirect (307) → /workspace/template
```

`template/page.tsx` (server) computes `authState: anonymous | no-repo |
has-repo` from the session and renders the shell — no redirects in any state.

## Content model

- `lib/workspace-paths.ts` owns the folder constants (`PROFILE_DIR`,
  `START_HERE_DIR`, `PROFILE_MAIN`, …) and `isValidPath` (moved from the file
  route). Dependency-free, client-safe.
- `lib/template-workspace.ts` (dependency-free, client-safe) owns the pure
  deterministic builders — `buildProfileFiles` (moved verbatim from 07's
  provisioning, which re-exports it), the shared Start Here CONTEXT contract,
  and `buildTemplateStartHereFiles` (the NEW minimal one-pager: what the
  draft is, how the system works, login unlocks the steps). Provisioning's
  fallback one-pager is NOT reused — it promises "your first step is already
  waiting", wrong for an empty template.
- `STEP1_PLACEHOLDER_DIR = "02-Step 1 - Your first step"` — tree-only
  placeholder, never a real file path, so it never trips `detectSeedState`.

Draft shape: `00-Profile/` (answers or "Not shared during onboarding") ·
`01-Start Here/` (one-pager + contract) · empty `02-Step 1` placeholder until
generated.

## Draft reader

`lib/onboarding-draft.ts` consolidates the `"onboarding-chat"` localStorage
reader + `draftProfile()` (latest `data-profile` part) — previously
duplicated in the onboarding screen and the workspace shell. Read-only: only
the real WorkspaceShell consumes (removes) the draft, after provisioning.

## Local store + FileApi

`template/_lib/local-file-api.ts` — `createTemplateStore()` owns the draft
outside React (the editor's closures always read current data; the shell
mirrors state for rendering via `setOnChange`). Implements the
`WorkspaceFileApi` seam with per-path counter shas. Envelope
`"workspace-template-v1"`: `{ version, touched, step1ProfileHash, files }` —
persisted on every mutation, shape-checked on load, quota failures degrade
to session-only.

## Tree extension

`FileTree` gained optional `files` / `folders` props: when `files` is set the
repo fetch (and its 401 redirect) never runs; `folders` renders file-less
folder chains (the step placeholder, with a "No files yet" row). Real
workspace callers pass neither — zero behavior change.

## Step-1 generation (`POST /api/workspace/template-step`)

Anonymous, no persistence — the exact provisioning pipeline minus the repo:
BotID → `teacherProfileSchema` → **enough-data gate** (name + ≥2 other
answers, else terminal `{ files: [] }`) → `getResourcesIndex` → fair-use
gate (`evaluateProfile` with Jev when key + budget, else the new pure
`fallbackEvaluation()` from lib/evaluation.ts) → `pickResource` →
`buildStepFiles` → `{ files }`. Registered in `instrumentation-client.ts`.
The client calls once per profile (`step1ProfileHash`), treats files-or-empty
as terminal, and retries only after HTTP/network failures.

## Create-route migration

`POST /api/workspace/create` accepts optional `files`: allowlisted prefixes
(`00-Profile/`, `01-Start Here/`, `NN-Step N - */`), `isValidPath` per entry,
≤60 files / ≤100k chars per file / ≤500k total → else 400 `invalid_files`.
Provided files **substitute per stage**: profile files replace
`buildProfileFiles`; start-here files land verbatim and skip the LLM pass
entirely (the personalized Start Here is exclusive to the direct onboarding
path); step files replace the evaluate/build run. Stages with no provided
files run exactly as before; `detectSeedState` idempotency and the 3-commit
structure are unchanged. On success the client clears the local envelope and
hard-navs to `/workspace`.

Edge accepted (documented, not handled): an envelope exists but the chat
draft has a NEWER profile — envelope files win for seeding; the payload's
schema profile only drives fallback stages. Cross-tab re-chat is rare and
the mismatch is benign (the teacher edits profile.md anyway).

## Close warning + leave rules

- `beforeunload` prompts only when `anonymous` AND (`profile` OR `touched`
  OR step files exist) — pristine untouched templates and logged-in visitors
  never get nagged.
- Logo click: dirty editor → `LeaveWorkspaceDialog` (save = local write);
  anonymous with content → `LeaveTemplateDialog` (primary: Log in to save);
  otherwise straight to `/en`.

## Error contract additions (shipped with this plan)

- `GitHubReauthorizationError` (lib/github.ts) — createWorkspaceRepo maps the
  403 "Resource not accessible by integration" (user token predates a
  permission grant, 99-known-issues #11) → route answers 403
  `github_reauthorization_needed` → both clients offer "Reconnect GitHub"
  (`lib/create-error.ts` owns the shared copy mapping).
- 451 `github_region_blocked` (trade controls, new in API 2026-03-10).
- All GitHub clients pin `X-GitHub-Api-Version: 2026-03-10`
  (`GITHUB_API_VERSION` in lib/github.ts; raw fetches in the auth chain,
  public-github, and tarball included).

## Housekeeping

- `/workspace/demo` mock deleted entirely (git history keeps it); the URL is a
  `next.config.ts` redirect (307 fires before routing — a page-level
  `redirect()` would only emit a meta refresh inside the workspace layout's
  streaming context).
- `.env.local` still carries `TEMPLATE_REPO` from the pre-rebuild
  template-repo design — nothing reads it; delete locally.
