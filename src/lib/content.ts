import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { ComponentType } from "react";

import { i18n, type Locale } from "@/i18n-config";

/**
 * File-based content layer.
 *
 * Content lives in `src/content/<type>/<slug>/<locale>.mdx`. Slugs must be
 * identical across locales so the language switcher can swap the locale
 * segment. The default-locale (en) file holds all shared fields (media,
 * links, ordering); other locale files only override translatable text.
 * When `<locale>.mdx` is missing entirely, the default locale (en) is used
 * as a fallback. All media lives on ImageKit — frontmatter references are
 * paths relative to the urlEndpoint, rendered with `@imagekit/next`.
 */

export type ContentType = "updates" | "team" | "legal" | "events";

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

// ---------------------------------------------------------------------------
// Frontmatter schemas (parsed by remark-frontmatter + remark-mdx-frontmatter,
// exported from each .mdx as `frontmatter`)
// ---------------------------------------------------------------------------

export interface UpdateFrontmatter {
  title: string;
  description: string;
  /** ISO date, e.g. "2026-09-10" */
  date: string;
  /** Slug of a team member in src/content/team/ */
  author?: string;
  tags?: string[];
  /** ImageKit path relative to the urlEndpoint, e.g. "/illustrations/together.svg" */
  cover?: string;
  /** Featured in the "Highlights" carousel on the updates overview. */
  highlight?: boolean;
  draft?: boolean;
}

export interface TeamFrontmatter {
  name: string;
  role: string;
  tags?: string[];
  links?: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
  /** ImageKit paths relative to the urlEndpoint, e.g. "/team/kiarash/kiarash1.jpg" */
  image?: string;
  hoverImage?: string;
  order?: number;
  /** Separated sections for the member page — kept out of the MDX body so
   *  they can be rendered individually. */
  whyUnited?: string;
  bio?: string;
  other?: string;
}

export interface LegalFrontmatter {
  title: string;
  description: string;
  /** ISO date, e.g. "2026-09-10" */
  lastUpdated: string;
}

export interface EventFrontmatter {
  title: string;
  description: string;
  /** ISO datetime, e.g. "2026-10-14T09:00" */
  startDate: string;
  endDate?: string;
  location?: string;
  tags?: string[];
  registrationUrl?: string;
  cover?: string;
}

interface FrontmatterByType {
  updates: UpdateFrontmatter;
  team: TeamFrontmatter;
  legal: LegalFrontmatter;
  events: EventFrontmatter;
}

export type Frontmatter<T extends ContentType> = FrontmatterByType[T];

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

interface MdxModule<FM> {
  default: ComponentType;
  frontmatter: FM;
}

export interface ContentEntry<FM> {
  slug: string;
  /** Locale the content was actually loaded in (differs from the requested
   *  locale when the EN fallback kicked in). */
  locale: Locale;
  frontmatter: FM;
  /** Estimated reading time of the MDX body, in minutes (min 1). */
  readingTime: number;
  Content: ComponentType;
}

const WORDS_PER_MINUTE = 200;

/** Rough word-count reading time: strips the frontmatter block, counts words
 *  containing at least one letter or digit. */
const estimateReadingTime = (raw: string): number => {
  const body = raw.replace(/^---[\s\S]*?---/, "");
  const words = body.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word));
  return Math.max(1, Math.round(words.length / WORDS_PER_MINUTE));
};

/** Directory names = slugs, for all content of a type. Runs at build time. */
export const getSlugs = cache((type: ContentType): string[] => {
  const dir = path.join(CONTENT_DIR, type);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
});

const localeFile = (type: ContentType, slug: string, locale: Locale) =>
  path.join(CONTENT_DIR, type, slug, `${locale}.mdx`);

/** Load one content item, falling back to the default locale. Null if the
 *  slug does not exist at all. Memoized per request via React cache().
 *
 *  The default-locale (en) file is the source of truth for shared fields
 *  (images, links, order, dates): when a locale file exists alongside it,
 *  the two frontmatter objects are merged — the locale file only needs to
 *  carry the translated text fields. */
export const getContent = cache(
  async <T extends ContentType>(
    type: T,
    slug: string,
    locale: Locale,
  ): Promise<ContentEntry<Frontmatter<T>> | null> => {
    const resolvedLocale = fs.existsSync(localeFile(type, slug, locale))
      ? locale
      : fs.existsSync(localeFile(type, slug, i18n.defaultLocale))
        ? i18n.defaultLocale
        : null;
    if (!resolvedLocale) return null;

    const load = async (l: Locale) =>
      (await import(`@/content/${type}/${slug}/${l}.mdx`)) as MdxModule<
        Frontmatter<T>
      >;

    const mod = await load(resolvedLocale);
    const base =
      resolvedLocale !== i18n.defaultLocale &&
      fs.existsSync(localeFile(type, slug, i18n.defaultLocale))
        ? await load(i18n.defaultLocale)
        : null;

    return {
      slug,
      locale: resolvedLocale,
      frontmatter: { ...base?.frontmatter, ...mod.frontmatter },
      readingTime: estimateReadingTime(
        fs.readFileSync(localeFile(type, slug, resolvedLocale), "utf8"),
      ),
      Content: mod.default,
    };
  },
);

/** All items of a type for a locale (EN fallback per item), drafts excluded. */
export const getAllContent = cache(
  async <T extends ContentType>(
    type: T,
    locale: Locale,
  ): Promise<ContentEntry<Frontmatter<T>>[]> => {
    const entries = await Promise.all(
      getSlugs(type).map((slug) => getContent(type, slug, locale)),
    );
    return entries.filter(
      (entry): entry is ContentEntry<Frontmatter<T>> =>
        entry !== null &&
        !(entry.frontmatter as { draft?: boolean }).draft,
    );
  },
);
