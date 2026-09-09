import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import { TagList } from "@/components/content/tag-list";
import type { Locale } from "@/i18n-config";
import type { ContentEntry, EventFrontmatter } from "@/lib/content";
import { formatDate } from "@/lib/utils";

interface EventCardProps {
  entry: ContentEntry<EventFrontmatter>;
  locale: Locale;
  detailsText: string;
}

const EventCard = ({ entry, locale, detailsText }: EventCardProps) => {
  const { frontmatter } = entry;
  return (
    <article className="group flex flex-col gap-3 border-b py-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <time dateTime={frontmatter.startDate}>
          {formatDate(frontmatter.startDate, locale, {
            dateStyle: "full",
            timeStyle: frontmatter.startDate.includes("T")
              ? "short"
              : undefined,
          })}
        </time>
        {frontmatter.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-4" />
            {frontmatter.location}
          </span>
        )}
      </div>
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        <Link
          href={`/${locale}/events/${entry.slug}`}
          className="transition-colors hover:text-muted-foreground"
        >
          {frontmatter.title}
        </Link>
      </h2>
      <p className="text-muted-foreground">{frontmatter.description}</p>
      <div className="flex items-center justify-between gap-4">
        <TagList tags={frontmatter.tags} />
        <Link
          href={`/${locale}/events/${entry.slug}`}
          className="flex shrink-0 items-center gap-1 text-sm font-medium underline underline-offset-4"
        >
          {detailsText}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};

export { EventCard };
