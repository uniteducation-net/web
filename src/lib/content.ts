import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { StaticImageData } from "next/image";
import { cache } from "react";
import type { ComponentType, SVGProps } from "react";

import { i18n, type Locale } from "@/i18n-config";

/**
 * File-based content layer.
 *
 * Content lives in `src/content/<type>/<slug>/<locale>.mdx` with co-located
 * assets (images, SVGs). Slugs must be identical across locales so the
 * language switcher can swap the locale segment. When `<locale>.mdx` is
 * missing, the default locale (en) is used as a fallback.
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
  /** Filename of a raster image co-located in the item folder, e.g. "cover.jpg" */
  cover?: string;
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
  /** Filenames co-located in the item folder (raster or .svg) */
  image?: string;
  hoverImage?: string;
  order?: number;
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
  Content: ComponentType;
}

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
 *  slug does not exist at all. Memoized per request via React cache(). */
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

    const mod = (await import(
      `@/content/${type}/${slug}/${resolvedLocale}.mdx`
    )) as MdxModule<Frontmatter<T>>;

    return {
      slug,
      locale: resolvedLocale,
      frontmatter: mod.frontmatter,
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

// ---------------------------------------------------------------------------
// Co-located assets
// ---------------------------------------------------------------------------

/** A co-located asset resolved through the bundler: raster files come back as
 *  StaticImageData (hashed URL, next/image-optimizable), .svg files come back
 *  as React components (via the SVGR rule in next.config.ts). */
export type ResolvedAsset =
  | { kind: "image"; data: StaticImageData }
  | { kind: "component"; Component: ComponentType<SVGProps<SVGSVGElement>> };

/** Resolve a frontmatter-referenced asset filename ("cover.jpg", "main.svg")
 *  inside an item folder. Null when the file does not exist. */
export const getAsset = cache(
  async (
    type: ContentType,
    slug: string,
    file: string | undefined,
  ): Promise<ResolvedAsset | null> => {
    if (!file) return null;
    if (!fs.existsSync(path.join(CONTENT_DIR, type, slug, file))) return null;
    const mod = await import(`@/content/${type}/${slug}/${file}`);
    const asset = mod.default;
    if (typeof asset === "function") {
      return { kind: "component", Component: asset };
    }
    return { kind: "image", data: asset as StaticImageData };
  },
);
