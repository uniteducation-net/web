import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/content/event-card";
import { hasLocale } from "@/i18n-config";
import { getAllContent, type EventFrontmatter } from "@/lib/content";
import { localeAlternates } from "@/lib/site";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/events">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return {
    title: dict.events.metaTitle,
    description: dict.events.metaDescription,
    alternates: localeAlternates(lang, "/events"),
  };
}

export default async function EventsPage({
  params,
}: PageProps<"/[lang]/events">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, events] = await Promise.all([
    getDictionary(lang),
    getAllContent("events", lang),
  ]);

  const now = new Date();
  const isUpcoming = (event: { frontmatter: EventFrontmatter }) =>
    new Date(event.frontmatter.endDate ?? event.frontmatter.startDate) >= now;
  const upcoming = events
    .filter(isUpcoming)
    .sort((a, b) => a.frontmatter.startDate.localeCompare(b.frontmatter.startDate));
  const past = events
    .filter((event) => !isUpcoming(event))
    .sort((a, b) => b.frontmatter.startDate.localeCompare(a.frontmatter.startDate));

  return (
    <section className="container max-w-3xl py-24 md:py-32">
      <h1 className="font-heading text-3xl font-semibold tracking-tighter md:text-5xl">
        {dict.events.heading}
      </h1>
      <h2 className="mt-12 font-heading text-xl font-semibold">
        {dict.events.upcoming}
      </h2>
      <div className="flex flex-col">
        {upcoming.map((entry) => (
          <EventCard
            key={entry.slug}
            entry={entry}
            locale={lang}
            detailsText={dict.events.details}
          />
        ))}
      </div>
      {past.length > 0 && (
        <>
          <h2 className="mt-16 font-heading text-xl font-semibold">
            {dict.events.past}
          </h2>
          <div className="flex flex-col">
            {past.map((entry) => (
              <EventCard
                key={entry.slug}
                entry={entry}
                locale={lang}
                detailsText={dict.events.details}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
