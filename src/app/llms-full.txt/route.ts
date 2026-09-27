import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { i18n } from "@/i18n-config";
import { getContent, getSlugs, type ContentType } from "@/lib/content";
import { getResourcesSnapshot } from "@/lib/resources-graph";
import { siteName, siteUrl } from "@/lib/site";

// Full markdown dump for AI agents: every MDX content entry in both locales
// (raw bodies from src/content — EN is the source of truth, a locale file
// that doesn't exist means the page renders the EN fallback) plus the live
// index of resource documents. Dynamic so a GitHub hiccup at build time
// can't freeze an empty resource list.
export const dynamic = "force-dynamic";

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
const CONTENT_DIR = join(process.cwd(), "src", "content");
// Milestones render only inside the about page slider — no standalone URLs.
const TYPES: { type: ContentType; heading: string }[] = [
  { type: "updates", heading: "Updates" },
  { type: "events", heading: "Events" },
  { type: "team", heading: "Team" },
  { type: "terms", heading: "Terms & policies" },
];

export async function GET() {
  const parts: string[] = [
    `# ${siteName} — full content`,
    "",
    `All public content of ${siteUrl} as markdown. Each entry is headed by its title, locale, and canonical URL.`,
    "",
  ];

  for (const { type, heading } of TYPES) {
    const slugs = getSlugs(type);
    if (slugs.length === 0) continue;
    parts.push(`# ${heading}`, "");
    for (const slug of slugs) {
      const entry = await getContent(type, slug, "en");
      for (const lang of i18n.locales) {
        let raw: string;
        try {
          raw = await readFile(
            join(CONTENT_DIR, type, slug, `${lang}.mdx`),
            "utf8",
          );
        } catch {
          continue; // locale file missing — page renders the EN fallback
        }
        const url = `${siteUrl}/${lang}/${type}/${slug}`;
        const fm = entry?.frontmatter as
          | { title?: string; name?: string }
          | undefined;
        const title = fm?.title ?? fm?.name ?? slug;
        parts.push(
          `## ${title} (${lang})`,
          "",
          `Source: ${url}`,
          "",
          raw.replace(FRONTMATTER_RE, "").trim(),
          "",
        );
      }
    }
  }

  // Resource docs stay linked, not inlined — the repo grows to ~2k files and
  // each one is already a fully server-rendered markdown page.
  const snapshot = await getResourcesSnapshot();
  if (snapshot.status === "ready") {
    parts.push("# Teaching resources (open collection)", "");
    for (const doc of snapshot.data.docs) {
      const suffix = doc.excerpt ? ` — ${doc.excerpt}` : "";
      parts.push(`- [${doc.title}](${siteUrl}${doc.href})${suffix}`);
    }
    parts.push("");
  }

  return new Response(parts.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
