import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { getContent, getSlugs } from "@/lib/content";
import { getDictionary } from "../../dictionaries";
import { TeamMemberProfile } from "../_components/team-member-profile";

// Slugs only — the parent [lang] layout generates the locales.
export function generateStaticParams() {
  return getSlugs("team").map((slug) => ({ slug }));
}

export const dynamicParams = false;

const load = async (params: Promise<{ lang: string; slug: string }>) => {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const entry = await getContent("team", slug, lang);
  if (!entry) notFound();
  const dict = await getDictionary(lang);
  return { lang, entry, dict };
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/team/[slug]">): Promise<Metadata> {
  const { entry } = await load(params);
  const { frontmatter } = entry;
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  return {
    title: frontmatter.name,
    description: frontmatter.role,
    openGraph:
      endpoint && frontmatter.image
        ? { images: [`${endpoint.replace(/\/$/, "")}${frontmatter.image}`] }
        : undefined,
  };
}

export default async function TeamMemberPage({
  params,
}: PageProps<"/[lang]/team/[slug]">) {
  const { lang, entry, dict } = await load(params);

  return (
    <TeamMemberProfile
      lang={lang}
      entry={entry}
      labels={{
        team: dict.team.heading,
        whyUnited: dict.team.member.whyUnited,
        bio: dict.team.member.bio,
        other: dict.team.member.other,
      }}
    />
  );
}
