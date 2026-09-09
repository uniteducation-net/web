import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { TagList } from "@/components/content/tag-list";
import type { Locale } from "@/i18n-config";
import type { ContentEntry, UpdateFrontmatter } from "@/lib/content";
import { formatDate } from "@/lib/utils";

interface UpdateCardProps {
  entry: ContentEntry<UpdateFrontmatter>;
  locale: Locale;
  readMoreText: string;
}

const UpdateCard = ({ entry, locale, readMoreText }: UpdateCardProps) => {
  const { frontmatter } = entry;
  return (
    <article className="group flex flex-col gap-3 border-b py-8">
      <time
        dateTime={frontmatter.date}
        className="text-sm text-muted-foreground"
      >
        {formatDate(frontmatter.date, locale)}
      </time>
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        <Link
          href={`/${locale}/updates/${entry.slug}`}
          className="transition-colors hover:text-muted-foreground"
        >
          {frontmatter.title}
        </Link>
      </h2>
      <p className="text-muted-foreground">{frontmatter.description}</p>
      <div className="flex items-center justify-between gap-4">
        <TagList tags={frontmatter.tags} />
        <Link
          href={`/${locale}/updates/${entry.slug}`}
          className="flex shrink-0 items-center gap-1 text-sm font-medium underline underline-offset-4"
        >
          {readMoreText}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};

export { UpdateCard };
