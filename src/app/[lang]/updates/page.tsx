import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { getAllContent } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { getDictionary } from "../dictionaries";
import { Highlights } from "./_components/highlights";
import { LatestUpdates } from "./_components/latest-updates";

export default async function UpdatesPage({
  params,
}: PageProps<"/[lang]/updates">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, updates] = await Promise.all([
    getDictionary(lang),
    getAllContent("updates", lang),
  ]);
  updates.sort((a, b) =>
    b.frontmatter.date.localeCompare(a.frontmatter.date),
  );

  const toPost = (entry: (typeof updates)[number]) => ({
    slug: entry.slug,
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
    summary: entry.frontmatter.description,
    label: entry.frontmatter.tags?.[0],
    published: formatDate(entry.frontmatter.date, lang),
    image: entry.frontmatter.cover,
    href: `/${lang}/updates/${entry.slug}`,
  });

  const highlighted = updates
    .filter((entry) => entry.frontmatter.highlight)
    .map(toPost);

  return (
    <>
      <Highlights
        heading={dict.updates.highlightsHeading}
        items={highlighted}
      />
      <LatestUpdates
        heading={dict.updates.latestHeading}
        description={dict.updates.latestDescription}
        posts={updates.map(toPost)}
      />
    </>
  );
}
