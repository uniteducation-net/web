// 11 step 7 — "Save this chat": persist the current agent conversation as a
// readable markdown transcript under chats/ in the teacher's own repo. This
// is the answer to "chat history is device-locked" (00 known issues #6):
// conversations the teacher cares about live in THEIR repo, on every device.
// The chats/ folder needs no scaffolding — GitHub creates it from the path.
// Plan: docs/plans/icm-workspace-plan/11-agent-panel.md

import { NextResponse } from "next/server";
import { RequestError } from "octokit";
import type { UIMessage } from "ai";
import { getSession } from "@/lib/session";
import { GitHubRateLimitError, writeFile } from "@/lib/github";

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09-13 14:32" — local date-time for the transcript header. */
function headerTimestamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-09-13-1432" — compact date-time for the filename (human sorting). */
function filenameTimestamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** 4-char random suffix so two saves in the same minute never collide. */
function randomSuffix(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url").slice(0, 4);
}

/**
 * Format UIMessages into a markdown transcript: `## 👤 You` /
 * `## 🤖 Assistant` sections, text parts only — tool and data parts are
 * noise in a saved transcript.
 */
function formatTranscript(messages: UIMessage[], now: Date): string {
  const lines: string[] = [`# Chat — ${headerTimestamp(now)}`, ""];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n\n")
      .trim();
    if (!text) continue;
    lines.push(
      message.role === "user" ? "## 👤 You" : "## 🤖 Assistant",
      "",
      text,
      "",
    );
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (!session.installationId || !session.repo) {
    // The /workspace guard (04) normally prevents this state entirely.
    return NextResponse.json({ error: "no_workspace" }, { status: 409 });
  }
  const { installationId, repo } = session;

  let messages: UIMessage[];
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages)) throw new Error("messages missing");
    messages = body.messages;
  } catch {
    return NextResponse.json(
      { error: "Bad request: expected { messages }." },
      { status: 400 },
    );
  }

  // Cheap insurance against unbounded transcripts (self-DoS only — the file
  // lands in the teacher's own repo, but keep commits sane).
  if (messages.length > 500 || JSON.stringify(messages).length > 500_000) {
    return NextResponse.json({ error: "chat_too_large" }, { status: 413 });
  }

  const now = new Date();
  const transcript = formatTranscript(messages, now);
  if (!transcript.includes("## ")) {
    return NextResponse.json({ error: "empty_chat" }, { status: 400 });
  }

  try {
    // Retry with a fresh suffix on the (practically impossible) collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const path = `chats/${filenameTimestamp(now)}-${randomSuffix()}.md`;
      try {
        await writeFile(
          installationId,
          repo.owner,
          repo.name,
          path,
          transcript,
          "Save chat transcript",
        );
        return NextResponse.json({ path });
      } catch (err) {
        if (err instanceof RequestError && err.status === 422) continue;
        throw err;
      }
    }
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: "github_rate_limited", message: err.message },
        { status: 503 },
      );
    }
    if (err instanceof RequestError && err.status >= 500) {
      return NextResponse.json(
        { error: "github_unavailable" },
        { status: 502 },
      );
    }
    console.error("save-chat failed:", err);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
