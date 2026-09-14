import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { getAllContent } from "@/lib/content";
import { getDictionary } from "../dictionaries";
import { AboutHero } from "./_components/about-hero";
import { AboutMilestones } from "./_components/about-milestones";
import { AboutMission } from "./_components/about-mission";
import { AboutTeam } from "./_components/about-team";
import { AboutValues } from "./_components/about-values";

export default async function AboutPage({
  params,
}: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, milestones, team] = await Promise.all([
    getDictionary(lang),
    getAllContent("milestones", lang),
    getAllContent("team", lang),
  ]);

  const activeMembers = team
    .filter((entry) => entry.frontmatter.tags?.includes("active"))
    .sort(
      (a, b) =>
        (a.frontmatter.order ?? Infinity) - (b.frontmatter.order ?? Infinity),
    );

  return (
    <>
      <AboutHero dict={dict.aboutHero} />
      <AboutMission />
      <AboutValues />
      <AboutMilestones
        lang={lang}
        title={dict.aboutMilestones.title}
        milestones={milestones
          .sort(
            (a, b) => (a.frontmatter.order ?? 0) - (b.frontmatter.order ?? 0),
          )
          .map(({ slug, frontmatter }) => ({ id: slug, ...frontmatter }))}
      />
      <AboutTeam
        members={activeMembers}
        locale={lang}
        dict={dict.aboutTeam}
      />
    </>
  );
}
