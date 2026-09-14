import { notFound } from "next/navigation";

import { hasLocale } from "@/i18n-config";

export default async function VolunteersPage({
  params,
}: PageProps<"/[lang]/volunteers">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  // Intentionally empty — content coming later.
  return <main className="flex-1" />;
}
