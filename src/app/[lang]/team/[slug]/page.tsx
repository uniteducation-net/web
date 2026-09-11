import { Image } from "@imagekit/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentArticle } from "@/components/content/content-article";
import { hasLocale } from "@/i18n-config";
import { getContent, getSlugs } from "@/lib/content";

export function generateStaticParams() {
  return getSlugs("team").map((slug) => ({ slug }));
}

export const dynamicParams = false;

const load = async (params: Promise<{ lang: string; slug: string }>) => {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const entry = await getContent("team", slug, lang);
  if (!entry) notFound();
  return { lang, entry };
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/team/[slug]">): Promise<Metadata> {
  const { entry } = await load(params);
  return { title: entry.frontmatter.name };
}

export default async function TeamMemberPage({
  params,
}: PageProps<"/[lang]/team/[slug]">) {
  const { entry } = await load(params);
  const { frontmatter, Content } = entry;

  return (
    <ContentArticle
      title={frontmatter.name}
      description={frontmatter.role}
      tags={frontmatter.tags}
    >
      {frontmatter.image && (
        <div className="not-prose relative mb-8 aspect-square w-40 overflow-hidden rounded-xl bg-muted">
          <Image
            src={frontmatter.image}
            alt={frontmatter.name}
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>
      )}
      <Content />
    </ContentArticle>
  );
}
