import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { hasLocale } from "@/i18n-config";
import { getContent, getSlugs } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { getDictionary } from "../../dictionaries";
import { LegalArticle } from "../_components/legal-article";

export function generateStaticParams() {
  return getSlugs("legal").map((slug) => ({ slug }));
}

export const dynamicParams = false;

const load = async (params: Promise<{ lang: string; slug: string }>) => {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const entry = await getContent("legal", slug, lang);
  if (!entry) notFound();
  return { lang, slug, entry };
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/legal/[slug]">): Promise<Metadata> {
  const { entry } = await load(params);
  return {
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
  };
}

export default async function LegalDocPage({
  params,
}: PageProps<"/[lang]/legal/[slug]">) {
  const { lang, slug, entry } = await load(params);
  const { frontmatter, Content } = entry;
  const dict = await getDictionary(lang);

  return (
    <>
      <BreadcrumbNav
        homeLabel={dict.common.home}
        homeHref={`/${lang}`}
        items={[
          { label: dict.legalOverview.heading, href: `/${lang}/legal` },
        ]}
        options={dict.legalOverview.items.map((item) => ({
          label: item.title,
          href: `/${lang}/legal/${item.id}`,
        }))}
        selectedHref={`/${lang}/legal/${slug}`}
        className="container pt-8"
      />
      <LegalArticle
        title={frontmatter.title}
        description={frontmatter.description}
        meta={
          <span>
            {dict.legalOverview.lastUpdatedText}:{" "}
            <time dateTime={frontmatter.lastUpdated}>
              {formatDate(frontmatter.lastUpdated, entry.locale)}
            </time>
          </span>
        }
      >
        <Content />
      </LegalArticle>
    </>
  );
}
