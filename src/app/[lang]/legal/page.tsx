import { Copyright, Scale, ScrollText, ShieldCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LegalOverview } from "@/components/legal/legal-overview";
import { hasLocale } from "@/i18n-config";
import { getDictionary } from "../dictionaries";

const itemIcons = {
  impressum: <Scale />,
  privacy: <ShieldCheck />,
  terms: <ScrollText />,
  copyright: <Copyright />,
  community: <Users />,
};

export default async function LegalPage({
  params,
}: PageProps<"/[lang]/legal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <>
      <BreadcrumbNav
        homeLabel={dict.common.home}
        homeHref={`/${lang}`}
        current={dict.legalOverview.heading}
        className="container pt-8"
      />
      <LegalOverview
        heading={dict.legalOverview.heading}
        readText={dict.legalOverview.readText}
        lastUpdatedText={dict.legalOverview.lastUpdatedText}
        items={dict.legalOverview.items.map((item) => ({
          ...item,
          link: `/${lang}/legal/${item.id}`,
          icon: itemIcons[item.id as keyof typeof itemIcons],
        }))}
        className="pt-10 md:pt-14"
      />
    </>
  );
}
