import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentArticle } from "@/components/content/content-article";
import { Button } from "@/components/ui/button";
import { hasLocale } from "@/i18n-config";
import { getContent, getSlugs } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { getDictionary } from "../../dictionaries";

export function generateStaticParams() {
  return getSlugs("events").map((slug) => ({ slug }));
}

export const dynamicParams = false;

const load = async (params: Promise<{ lang: string; slug: string }>) => {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const entry = await getContent("events", slug, lang);
  if (!entry) notFound();
  return { lang, entry };
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/events/[slug]">): Promise<Metadata> {
  const { entry } = await load(params);
  return {
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
  };
}

export default async function EventPage({
  params,
}: PageProps<"/[lang]/events/[slug]">) {
  const { lang, entry } = await load(params);
  const { frontmatter, Content } = entry;
  const dict = await getDictionary(lang);

  return (
    <ContentArticle
      title={frontmatter.title}
      description={frontmatter.description}
      tags={frontmatter.tags}
      meta={
        <span className="flex flex-wrap items-center gap-3">
          <time dateTime={frontmatter.startDate}>
            {formatDate(frontmatter.startDate, entry.locale, {
              dateStyle: "full",
              timeStyle: frontmatter.startDate.includes("T")
                ? "short"
                : undefined,
            })}
          </time>
          {frontmatter.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {frontmatter.location}
            </span>
          )}
        </span>
      }
    >
      <Content />
      {frontmatter.registrationUrl && (
        <Button asChild className="mt-4 not-prose">
          <a
            href={frontmatter.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {dict.events.register}
          </a>
        </Button>
      )}
    </ContentArticle>
  );
}
