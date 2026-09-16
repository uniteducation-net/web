import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { getContent, getSlugs } from "@/lib/content";
import { getDictionary } from "../../dictionaries";
import { UpdateArticle } from "../_components/update-article";

// Slugs only — the parent [lang] layout generates the locales.
export function generateStaticParams() {
  return getSlugs("updates").map((slug) => ({ slug }));
}

export const dynamicParams = false;

const load = async (params: Promise<{ lang: string; slug: string }>) => {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const entry = await getContent("updates", slug, lang);
  if (!entry) notFound();
  const [dict, authorEntry] = await Promise.all([
    getDictionary(lang),
    entry.frontmatter.author
      ? getContent("team", entry.frontmatter.author, lang)
      : null,
  ]);
  return { lang, entry, dict, authorEntry };
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/updates/[slug]">): Promise<Metadata> {
  const { entry } = await load(params);
  return {
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
  };
}

export default async function UpdatePage({
  params,
}: PageProps<"/[lang]/updates/[slug]">) {
  const { lang, entry, dict, authorEntry } = await load(params);
  const { frontmatter, Content } = entry;

  return (
    <UpdateArticle
      lang={lang}
      title={frontmatter.title}
      date={frontmatter.date}
      readingTime={entry.readingTime}
      cover={frontmatter.cover}
      author={
        authorEntry
          ? {
              name: authorEntry.frontmatter.name,
              slug: authorEntry.slug,
              image: authorEntry.frontmatter.image,
            }
          : undefined
      }
      labels={{
        updates: dict.updates.heading,
        minRead: dict.updates.minRead,
        onThisPage: dict.updates.onThisPage,
        shareArticle: dict.updates.shareArticle,
        backToTop: dict.updates.backToTop,
        copyLink: dict.updates.copyLink,
        linkCopied: dict.updates.linkCopied,
      }}
    >
      <Content />
    </UpdateArticle>
  );
}
