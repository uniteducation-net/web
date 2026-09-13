import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
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

  const dict = await getDictionary(lang);

  return (
    <>
      <AboutHero dict={dict.aboutHero} />
      <AboutMission />
      <AboutValues />
      <AboutMilestones />
      <AboutTeam />
    </>
  );
}
