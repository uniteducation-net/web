import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { TallyEmbed } from "@/components/tally-embed";
import { hasLocale } from "@/i18n-config";
import { getDictionary } from "../../../dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-involved/membership/join">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return { title: dict.membershipPage.join.metaTitle };
}

export default async function MembershipJoinPage({
  params,
}: PageProps<"/[lang]/get-involved/membership/join">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <main className="flex flex-1 flex-col">
      <BreadcrumbNav
        homeLabel={dict.common.home}
        homeHref={`/${lang}`}
        items={[
          {
            label: dict.header.getInvolved.label,
            href: `/${lang}/get-involved`,
          },
          {
            label: dict.membershipPage.heading,
            href: `/${lang}/get-involved/membership`,
          },
        ]}
        current={dict.membershipPage.join.breadcrumbCurrent}
        className="container pt-8"
      />
      {/* min-h = viewport minus header + breadcrumb: the body's flex column
          otherwise squeezes the form to whatever the footer leaves over. */}
      <div className="relative min-h-[calc(100dvh-10rem)] flex-1">
        <TallyEmbed
          formId="Xxp0bO"
          title={dict.membershipPage.join.metaTitle}
        />
      </div>
    </main>
  );
}
