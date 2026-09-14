import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TallyEmbed } from "@/components/tally-embed";
import { hasLocale } from "@/i18n-config";

export const metadata: Metadata = {
  title: "Membership Application",
};

export default async function MembershipJoinPage({
  params,
}: PageProps<"/[lang]/membership/join">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <main className="relative flex-1">
      <TallyEmbed formId="Xxp0bO" title="Membership Application" />
    </main>
  );
}
