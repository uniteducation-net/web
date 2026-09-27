import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { localeAlternates } from "@/lib/site";
import { getDictionary } from "../../dictionaries";
import { ShareKnowledgeHero } from "./_components/share-knowledge-hero";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-involved/share-knowledge">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return {
    title: dict.shareKnowledgePage.metaTitle,
    description: dict.shareKnowledgePage.metaDescription,
    alternates: localeAlternates(lang, "/get-involved/share-knowledge"),
  };
}

export default async function ShareKnowledgePage({
  params,
}: PageProps<"/[lang]/get-involved/share-knowledge">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const page = dict.shareKnowledgePage;

  return (
    <ShareKnowledgeHero
      heading={page.heading}
      description={page.description}
      primary={{
        text: page.primaryText,
        url: "mailto:hello@uniteducation.net",
      }}
      secondary={{ text: page.secondaryText, url: "/resources" }}
      image={{ src: "/illustrations/group-project.svg", alt: page.imageAlt }}
    />
  );
}
