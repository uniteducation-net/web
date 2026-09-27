import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { getDictionary } from "../../dictionaries";
import { PartnerHero } from "./_components/partner-hero";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-involved/partner">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return { title: dict.partnerPage.metaTitle };
}

export default async function PartnerPage({
  params,
}: PageProps<"/[lang]/get-involved/partner">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const page = dict.partnerPage;

  return (
    <PartnerHero
      heading={page.heading}
      description={page.description}
      primary={{
        text: page.primaryText,
        url: "mailto:hello@uniteducation.net",
      }}
      image={{ src: "/illustrations/term-sheet.svg", alt: page.imageAlt }}
    />
  );
}
