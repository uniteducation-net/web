import { notFound } from "next/navigation";

import { TeamCard } from "@/components/content/team-card";
import { hasLocale } from "@/i18n-config";
import { getAllContent } from "@/lib/content";
import { getDictionary } from "../dictionaries";

export default async function TeamPage({
  params,
}: PageProps<"/[lang]/team">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, members] = await Promise.all([
    getDictionary(lang),
    getAllContent("team", lang),
  ]);
  members.sort(
    (a, b) => (a.frontmatter.order ?? 0) - (b.frontmatter.order ?? 0),
  );

  return (
    <section className="container py-24 md:py-32">
      <h1 className="font-heading text-3xl font-semibold tracking-tighter md:text-5xl">
        {dict.team.heading}
      </h1>
      <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((entry) => (
          <TeamCard key={entry.slug} entry={entry} locale={lang} />
        ))}
      </div>
    </section>
  );
}
