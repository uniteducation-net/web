import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { getDictionary } from "../../dictionaries";
import { MembershipHero } from "./_components/membership-hero";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-involved/membership">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return { title: dict.membershipPage.metaTitle };
}

export default async function MembershipPage({
  params,
}: PageProps<"/[lang]/get-involved/membership">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const page = dict.membershipPage;

  return (
    <MembershipHero
      heading={page.heading}
      description={page.description}
      primary={{
        text: page.primaryText,
        url: `/${lang}/get-involved/membership/join`,
      }}
      pricing={page.pricing}
      image={{ src: "/illustrations/team.svg", alt: page.imageAlt }}
    />
  );
}
