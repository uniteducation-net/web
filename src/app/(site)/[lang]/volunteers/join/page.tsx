import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TallyEmbed } from "@/components/tally-embed";
import { hasLocale } from "@/i18n-config";

export const metadata: Metadata = {
  title: "Support UnitEd",
};

export default async function VolunteersJoinPage({
  params,
}: PageProps<"/[lang]/volunteers/join">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <main className="relative flex-1">
      <TallyEmbed formId="Y5pGZW" title="Support UnitEd" />
    </main>
  );
}
