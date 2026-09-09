import { notFound } from "next/navigation";

import { UpdateCard } from "@/components/content/update-card";
import { hasLocale } from "@/i18n-config";
import { getAllContent } from "@/lib/content";
import { getDictionary } from "../dictionaries";

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

  return (
    <section className="container max-w-3xl py-24 md:py-32">
      <h1 className="font-heading text-3xl font-semibold tracking-tighter md:text-5xl">
        {dict.updates.heading}
      </h1>
      <div className="mt-10 flex flex-col">
        {updates.map((entry) => (
          <UpdateCard
            key={entry.slug}
            entry={entry}
            locale={lang}
            readMoreText={dict.updates.readMore}
          />
        ))}
      </div>
    </section>
  );
}
