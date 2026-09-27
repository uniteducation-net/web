import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { hasLocale } from "@/i18n-config";
import { getDictionary } from "../dictionaries";
import { GetInvolvedBento } from "./_components/get-involved-bento";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-involved">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return { title: dict.getInvolvedPage.metaTitle };
}

export default async function GetInvolvedPage({
  params,
}: PageProps<"/[lang]/get-involved">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const page = dict.getInvolvedPage;

  return (
    <>
      <BreadcrumbNav
        homeLabel={dict.common.home}
        homeHref={`/${lang}`}
        current={dict.header.getInvolved.label}
        className="container pt-8"
      />
      <section className="container py-12 md:py-16">
        <h1 className="text-center font-heading text-display font-semibold text-balance">
          {page.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lead text-muted-foreground">
          {page.subtitle}
        </p>
        <GetInvolvedBento
          lang={lang}
          items={dict.header.getInvolved.items}
          className="mt-12 md:mt-16"
        />
      </section>
    </>
  );
}
