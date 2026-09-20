"use client";

// Thin client wrapper around react-markdown (matches the agent panel's
// usage). Frontmatter is already stripped and `[[wikilinks]]` already
// rewritten to real links by the server page.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  );
}
