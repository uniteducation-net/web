import type { MetadataRoute } from "next";
import { getContent, getSlugs, type ContentType } from "@/lib/content";
import { getResourcesSnapshot } from "@/lib/resources-graph";
import { siteUrl } from "@/lib/site";

const STATIC_ROUTES = [
  "",
  "/about",
  "/team",
  "/updates",
  "/events",
  "/get-involved",
  "/get-involved/volunteer",
  "/get-involved/partner",
  "/get-involved/membership",
  "/get-involved/donate",
  "/get-involved/share-knowledge",
  "/terms",
];

const CONTENT_TYPES: ContentType[] = ["team", "updates", "events", "terms"];

// Regenerate at most every 5 min (mirrors the resources snapshot TTL): a
// GitHub hiccup at build time must not freeze a doc-less sitemap.
export const revalidate = 300;

/** hreflang cluster for a localized route — slugs are identical across
 *  locales by design, so every route exists in both languages. */
function languagesFor(route: string) {
  return {
    en: `${siteUrl}/en${route}`,
    de: `${siteUrl}/de${route}`,
    "x-default": `${siteUrl}/en${route}`,
  };
}

/** Real content-modified date per frontmatter type (updates `date`, terms
 *  `lastUpdated`, events `startDate`); undefined when unknown — never fake. */
function contentDate(frontmatter: Record<string, unknown>): Date | undefined {
  const raw =
    frontmatter.date ?? frontmatter.lastUpdated ?? frontmatter.startDate;
  if (typeof raw !== "string") return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of STATIC_ROUTES) {
    entries.push({
      url: `${siteUrl}/en${route}`,
      alternates: { languages: languagesFor(route) },
      changeFrequency: route === "" ? "weekly" : "monthly",
      priority: route === "" ? 1 : 0.7,
    });
  }

  for (const type of CONTENT_TYPES) {
    for (const slug of getSlugs(type)) {
      const entry = await getContent(type, slug, "en");
      entries.push({
        url: `${siteUrl}/en/${type}/${slug}`,
        lastModified: entry
          ? contentDate(entry.frontmatter as unknown as Record<string, unknown>)
          : undefined,
        alternates: { languages: languagesFor(`/${type}/${slug}`) },
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  // Locale-independent app routes (the resources explorer is English-only).
  entries.push({
    url: `${siteUrl}/resources`,
    changeFrequency: "weekly",
    priority: 0.7,
  });
  entries.push({
    url: `${siteUrl}/resources/all`,
    changeFrequency: "weekly",
    priority: 0.6,
  });

  // Every resource doc — the explorer's interactive tree is not crawlable on
  // its own, so the sitemap (plus the on-page index) carries the full list.
  // A GitHub hiccup must never break the sitemap: skip silently.
  const snapshot = await getResourcesSnapshot();
  if (snapshot.status === "ready") {
    for (const doc of snapshot.data.docs) {
      entries.push({
        url: `${siteUrl}${doc.href}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
