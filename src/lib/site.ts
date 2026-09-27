/**
 * Single source of truth for the site's absolute URL and brand name —
 * used by the metadata files (robots, sitemap, layouts) and JSON-LD.
 * APP_URL may carry a trailing slash; metadata URLs must not.
 */
export const siteUrl = (
  process.env.APP_URL ?? "https://uniteducation.net"
).replace(/\/+$/, "");

export const siteName = "UnitEd";

/**
 * Canonical + hreflang cluster for a localized route. `path` is the
 * locale-less route ("" for home, "/about", "/updates/launch"). Slugs are
 * identical across locales by design (src/lib/content.ts), so every route
 * exists in both languages; x-default points at English.
 */
export function localeAlternates(lang: string, path: string) {
  const en = `${siteUrl}/en${path}`;
  const de = `${siteUrl}/de${path}`;
  return {
    canonical: lang === "de" ? de : en,
    languages: { en, de, "x-default": en } as Record<string, string>,
  };
}
