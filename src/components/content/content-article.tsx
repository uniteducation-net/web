import type { ReactNode } from "react";

import { TagList } from "@/components/content/tag-list";
import { cn } from "@/lib/utils";

interface ContentArticleProps {
  title: string;
  description?: string;
  /** Date / location / "last updated" line above the title. */
  meta?: ReactNode;
  tags?: string[];
  children: ReactNode;
  className?: string;
}

/** Shared article template for MDX-backed detail pages (updates, events,
 *  terms, team bios). */
const ContentArticle = ({
  title,
  description,
  meta,
  tags,
  children,
  className,
}: ContentArticleProps) => {
  return (
    <article className={cn("container max-w-3xl py-24 md:py-32", className)}>
      <header className="mb-10 flex flex-col gap-4 md:mb-14">
        {meta && <div className="text-sm text-muted-foreground">{meta}</div>}
        <h1 className="font-heading text-3xl font-semibold tracking-tighter md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
        <TagList tags={tags} />
      </header>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        {children}
      </div>
    </article>
  );
};

export { ContentArticle };
