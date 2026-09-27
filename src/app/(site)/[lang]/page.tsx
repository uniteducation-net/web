import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActiveMembers } from "@/components/active-members";
import { Faq } from "@/components/faq";
import { HomeHero } from "@/components/home-hero";
import { HowItWorks } from "@/components/how-it-works";
import { UNQuote } from "@/components/un-quote";
import { hasLocale } from "@/i18n-config";
import { getAllContent } from "@/lib/content";
import { localeAlternates } from "@/lib/site";
import { getDictionary } from "./dictionaries";

// Title/description stay inherited from the layout default (the home hero
// copy) — this page only pins the canonical + hreflang cluster for /{lang}.
export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return { alternates: localeAlternates(lang, "") };
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  // Active members, strictly ordered by frontmatter `order`, capped at 9 —
  // the 10th carousel slot goes to the join-CTA card.
  const activeMembers = (await getAllContent("team", lang))
    .filter((entry) => entry.frontmatter.tags?.includes("active"))
    .sort(
      (a, b) =>
        (a.frontmatter.order ?? Infinity) - (b.frontmatter.order ?? Infinity),
    )
    .slice(0, 9);

  return (
    <>
      <HomeHero dict={dict.homeHero} lang={lang} />
      <UNQuote />
      <HowItWorks />
      <ActiveMembers
        members={activeMembers}
        locale={lang}
        dict={dict.activeMembers}
      />
      <Faq dict={dict.faq} lang={lang} />
    </>
  );
}
