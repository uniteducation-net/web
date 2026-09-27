# 16 — Resources repo rebuild + Jev-classified step workspaces

The Resources repo (`uniteducation-net/Resources`) was rebuilt as an ICM
knowledge base and this app was wired to it. This doc is the contract
between the two repos.

## The Resources repo (structure)

```
CLAUDE.md / CONTEXT.md     routing + query protocol
00-inbox/                  uncategorized drops (triaged later)
10-logics/
  10_learners/             who we teach (final research, verbatim)
  20_content-framework/    the seven categories 1.1 … 3.2 (verbatim)
  30_matching/             profile questions, Jev evaluation spec, progression rules
20-resources/
  10_native/               UnitEd's own markdown resources
  20_links/                third-party links (url + description)
  30_providers/            big providers — small parts fetched live
_templates/                stamps for new content
```

Every content file carries single-line frontmatter: `type` (native | link |
provider | logic), `category` (1.1 … 3.2 | none), `tags`, `status`
(approved | draft), `url` (link/provider). Research text in 10-logics/ is
final — categorize, never rewrite.

## What the app does with it

1. **Onboarding** (05/06): the interview collects name + the five final
   questions (ageGroup, workedWithChildren, background, teachingWhatWhere,
   schedule) — one question per message. Schema: `teacherProfileSchema` in
   `src/lib/onboarding.ts`.
2. **Background classification** (`src/lib/evaluation.ts`): one
   `experimental_evaluate` call with `gateway.evaluation("typesafe-ai/jev")`
   — Jev answers typed questions (choice/score/boolean) against the profile;
   code combines them (confidence floor 0.6 computed from the probability
   distribution; 3.1 Ethics & Safeguarding mandatory early; never repeat a
   done category; matrix-priority fallback order 1.1 → 1.3 → 1.2 → 3.1 →
   2.1 → 2.2 → 3.2). Jev never writes text.
3. **Provisioning** (07 + `buildStepFiles`): new workspaces get
   `00-Profile/`, `01-Start Here/`, and `02-Step 1 - <Title>/` with one
   matched resource. Step files carry `category:` + `resource:` frontmatter —
   that is the dedupe record.
4. **Next step** ("Open my next step" button on step files, 15 header): saves
   the chat (11 step 6), asks two short questions in the agent panel, then
   the `createNextStep` tool updates the profile's progress log, re-evaluates
   with Jev, and writes the next numbered step folder with one unused
   resource.
5. **Providers** (`src/lib/fetch-provider.ts`): fetched live at step
   creation; HTML pages are quoted as small excerpts with attribution, PDFs
   degrade to the card description + link (the repo contract's documented
   path).
6. **Explorer** (`/resources/all`): the graph reads the whole repo via
   tarball; routing files (CONTEXT/README/CLAUDE) are tree/reader entries
   but not graph nodes; node colors key on the new `type:` values.

## Failure contract

Every external dependency degrades in-band, never blocks: no gateway key →
deterministic seeding (Jev skipped); Resources repo unreachable →
provisioning lands without Step 1; provider fetch fails → link-out.
