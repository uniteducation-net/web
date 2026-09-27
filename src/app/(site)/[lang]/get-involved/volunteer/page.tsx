import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { getDictionary } from "../../dictionaries";
import { VolunteerHero } from "./_components/volunteer-hero";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-involved/volunteer">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return { title: dict.volunteerPage.metaTitle };
}

export default async function VolunteerPage({
  params,
}: PageProps<"/[lang]/get-involved/volunteer">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const page = dict.volunteerPage;

  return (
    <VolunteerHero
      heading={page.heading}
      description={page.description}
      primary={{
        text: page.primaryText,
        url: `/${lang}/get-involved/volunteer/join`,
      }}
      image={{ src: "/illustrations/team-collaboration.svg", alt: page.imageAlt }}
    />
  );
}
