import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";
import { MembershipHero } from "./_components/membership-hero";

export default async function MembershipPage({
  params,
}: PageProps<"/[lang]/membership">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return <MembershipHero />;
}
