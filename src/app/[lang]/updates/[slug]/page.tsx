import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentArticle } from "@/components/content/content-article";
import { hasLocale, type Locale } from "@/i18n-config";
import { getContent, getSlugs } from "@/lib/content";
import { formatDate } from "@/lib/utils";

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
  return { lang, entry };
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
  const { entry } = await load(params);
  const { frontmatter, Content } = entry;

  return (
    <ContentArticle
      title={frontmatter.title}
      description={frontmatter.description}
      tags={frontmatter.tags}
      meta={
        <time dateTime={frontmatter.date}>
          {formatDate(frontmatter.date, entry.locale as Locale)}
        </time>
      }
    >
      <Content />
    </ContentArticle>
  );
}
