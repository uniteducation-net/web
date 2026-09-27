import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ExternalEmbedGate } from "@/components/external-embed-gate";
import { TallyEmbed } from "@/components/tally-embed";
import { hasLocale } from "@/i18n-config";
import { localeAlternates } from "@/lib/site";
import { getDictionary } from "../../../dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-involved/volunteer/join">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return {
    title: dict.volunteerPage.join.metaTitle,
    description: dict.volunteerPage.join.metaDescription,
    alternates: localeAlternates(lang, "/get-involved/volunteer/join"),
  };
}

export default async function VolunteerJoinPage({
  params,
}: PageProps<"/[lang]/get-involved/volunteer/join">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbNav
        homeLabel={dict.common.home}
        homeHref={`/${lang}`}
        items={[
          {
            label: dict.header.getInvolved.label,
            href: `/${lang}/get-involved`,
          },
          {
            label: dict.volunteerPage.heading,
            href: `/${lang}/get-involved/volunteer`,
          },
        ]}
        current={dict.volunteerPage.join.breadcrumbCurrent}
        className="container pt-8"
      />
      {/* min-h = viewport minus header + breadcrumb: the body's flex column
          otherwise squeezes the form to whatever the footer leaves over. */}
      <div className="relative min-h-[calc(100dvh-10rem)] flex-1">
        <ExternalEmbedGate
          text={dict.common.externalContentGate.text}
          buttonLabel={dict.common.externalContentGate.button}
          className="absolute inset-0"
        >
          <TallyEmbed
            formId="Y5pGZW"
            title={dict.volunteerPage.join.metaTitle}
          />
        </ExternalEmbedGate>
      </div>
    </div>
  );
}
