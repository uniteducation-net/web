export interface MockToolActivity {
  text: string;
  done: boolean;
}

export interface MockMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  activity?: MockToolActivity[];
}

export const mockFiles: string[] = [
  "CONTEXT.md",
  "00-profile/CONTEXT.md",
  "00-profile/teacher-profile.md",
  "01-research/CONTEXT.md",
  "01-research/references/curriculum-notes.md",
  "01-research/output/topic-brief.md",
  "02-outline/CONTEXT.md",
  "02-outline/output/lesson-outline.md",
  "03-script/CONTEXT.md",
  "03-script/references/voice-rules.md",
  "03-script/output/lesson-script.md",
  "04-review/CONTEXT.md",
  "chats/2026-09-10-1415-k3f2.md",
  "assets/class-photo.png",
];

export const mockContents: Record<string, string> = {
  "CONTEXT.md": `# Ms. Rivera's Teaching Workspace

Welcome! This is your personal workspace. Everything here is a plain file in
**your own GitHub repo** — the assistant on the right reads and edits these
files for you.

## Where do I go?

| Stage | Folder | What happens there |
|---|---|---|
| 0 | \`00-profile/\` | Who you are and how you teach |
| 1 | \`01-research/\` | Topic research for your next lesson |
| 2 | \`02-outline/\` | A lesson outline is drafted |
| 3 | \`03-script/\` | The full lesson script, in your voice |
| 4 | \`04-review/\` | You review and polish before class |

## How it works

1. Tell the assistant what you're teaching next.
2. Each stage reads the previous stage's \`output/\` and writes its own.
3. **You review between stages** — nothing moves on without you.

> Tip: every folder has a \`CONTEXT.md\` that explains its rules. When in
> doubt, open it.
`,

  "00-profile/CONTEXT.md": `# Stage 00 — Profile

This stage is already done — it was created from your onboarding chat.

## Files

- \`teacher-profile.md\` — your subject, grade level, context, tone and goals.

## Contract

Every later stage reads the profile first so materials sound like **you**.
If anything here is wrong, just ask the assistant to update it.
`,

  "00-profile/teacher-profile.md": `# Teacher Profile

- **Name:** Ana Rivera
- **Subject:** Biology
- **Grade level:** Grade 8
- **Context:** Public secondary school, Lisbon
- **Tone:** Warm, plain language, a little playful
- **Goals:** "I want my students to argue from evidence, not memorize."
`,

  "01-research/CONTEXT.md": `# Stage 01 — Research

## Input

- The lesson topic you give the assistant.
- \`00-profile/teacher-profile.md\` (always).

## Output

- \`output/topic-brief.md\` — key concepts, common misconceptions, and 2–3
  anchor phenomena, matched to your curriculum notes.

## Rules

- Cite sources in plain language.
- Flag anything above grade level.
`,

  "01-research/references/curriculum-notes.md": `# Curriculum Notes

- Photosynthesis is taught in term 2, after cell structure.
- Required: light-dependent vs. light-independent reactions at a
  conceptual level only.
- Lab time available: one 50-minute double period.
`,

  "01-research/output/topic-brief.md": `# Topic Brief — Photosynthesis

## Key concepts

1. Plants convert light energy into chemical energy (glucose).
2. Chlorophyll in chloroplasts captures the light.
3. Oxygen is a byproduct of splitting water.

## Common misconceptions

- "Plants get their food from soil." (Mass mostly comes from CO₂ in air.)
- "Photosynthesis only happens in daylight." (The Calvin cycle continues.)

## Anchor phenomena

- Elodea bubbling under a lamp vs. in the dark.
- A sealed terrarium that survives for years unopened.
`,

  "02-outline/CONTEXT.md": `# Stage 02 — Outline

## Input

- \`01-research/output/topic-brief.md\`

## Output

- \`output/lesson-outline.md\` — a timed 50-minute lesson skeleton:
  hook, activities, checks for understanding.

## Rules

- Keep total planned time at 45 minutes — leave 5 for overrun.
- Every activity must tie back to the profile's goals.
`,

  "02-outline/output/lesson-outline.md": `# Lesson Outline — Photosynthesis (Grade 8)

| Time | Segment | Activity |
|---|---|---|
| 0:00 | Hook | Terrarium mystery: "How is it still alive?" |
| 0:07 | Direct instruction | Light → glucose, with the Elodea demo |
| 0:20 | Pair work | Misconception cards — agree or disagree? |
| 0:35 | Exit ticket | One-sentence argument from evidence |

## Checks for understanding

- [ ] Can students explain where a plant's mass comes from?
- [ ] Can they use "evidence" language in the exit ticket?
`,

  "03-script/CONTEXT.md": `# Stage 03 — Script

## Input

- \`02-outline/output/lesson-outline.md\`
- \`references/voice-rules.md\`

## Output

- \`output/lesson-script.md\` — the full lesson in your voice, with
  teacher moves and likely student responses.

## Rules

- Follow the voice rules exactly.
- Write student-facing language at grade level.
`,

  "03-script/references/voice-rules.md": `# Voice Rules

- Warm and direct. Short sentences.
- Ask more than you tell.
- Use "we" for the class, "you" for instructions.
- One joke per lesson is allowed. Puns about plants are encouraged.
`,

  "03-script/output/lesson-script.md": `# Lesson Script — Photosynthesis

## Hook (0:00)

> "Look at this terrarium. I sealed it two years ago. Nobody has fed it.
> So — how is it still alive? Turn to your neighbor: 30 seconds, one theory."

*Circulate. Listen for "it eats the soil." That's your thread to pull.*

## Direct instruction (0:07)

> "Here's the twist: a plant's body is built mostly from *air*. The soil
> gives minerals, water climbs the stem — but the mass? Carbon dioxide."

*(Write CO₂ → glucose on the board. Draw the arrow big.)*
`,

  "04-review/CONTEXT.md": `# Stage 04 — Review

This stage is yours — no automation. Read the script, change anything,
and ask the assistant to apply your edits.

## Checklist

- [ ] Timings realistic for your class?
- [ ] Materials on hand for the Elodea demo?
- [ ] Exit ticket printed?
`,

  "chats/2026-09-10-1415-k3f2.md": `# Chat — Sep 10, 2026

**Topic:** warming up the tone rules

- You asked to make the voice rules friendlier.
- Added: "One joke per lesson is allowed. Puns about plants are encouraged."
`,
};

export const mockMessages: MockMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "I want to teach photosynthesis next week. Grade 8.",
  },
  {
    id: "m2",
    role: "assistant",
    activity: [
      { text: "Reading 00-profile/teacher-profile.md", done: true },
      { text: "Reading 01-research/references/curriculum-notes.md", done: true },
      { text: "Wrote 01-research/output/topic-brief.md", done: true },
    ],
    content:
      "Great timing — your curriculum notes place photosynthesis in term 2, so this fits perfectly.\n\nI ran **stage 01** and wrote a topic brief. The highlights:\n\n- Two common misconceptions worth attacking head-on (starting with \"plants eat soil\").\n- The Elodea demo fits your one 50-minute double period.\n\nTake a look at `01-research/output/topic-brief.md` — if it reads well, I'll draft the lesson outline next.",
  },
  {
    id: "m3",
    role: "user",
    content: "Looks good. Do the outline.",
  },
  {
    id: "m4",
    role: "assistant",
    activity: [
      { text: "Reading 02-outline/CONTEXT.md", done: true },
      { text: "Wrote 02-outline/output/lesson-outline.md", done: true },
    ],
    content:
      "Done — `02-outline/output/lesson-outline.md` is ready.\n\nI opened with a sealed-terrarium mystery as the hook and kept the plan to **45 minutes** so you have 5 for overrun, per your stage rules. The exit ticket pushes on your goal: students arguing from evidence rather than reciting.\n\nWant me to write the full script in your voice?",
  },
  {
    id: "m5",
    role: "user",
    content: "Yes, and make the hook a bit more playful.",
  },
  {
    id: "m6",
    role: "assistant",
    activity: [
      { text: "Reading 03-script/references/voice-rules.md", done: true },
      { text: "Wrote 03-script/output/lesson-script.md", done: true },
    ],
    content:
      "Script's in `03-script/output/lesson-script.md` — hook included, slightly mischievous, and within your one-joke allowance from the voice rules. I spent the plant pun early so it doesn't distract from the exit ticket.\n\nEverything's ready for your review in **stage 04** when you are.",
  },
];

export const mockSuggestions = [
  "Run stage 01 with my next lesson topic",
  "Make my tone rules warmer",
  "Explain what's in my workspace",
];

export const mockCannedReply =
  "I've noted that — in the live app I'd read and edit your workspace files right here. This preview is running on mock data, so nothing was actually written.";
