import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface LegalArticleProps {
  title: string;
  description?: string;
  /** "Last updated" line rendered under the title. */
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

const LegalArticle = ({
  title,
  description,
  meta,
  children,
  className,
}: LegalArticleProps) => {
  return (
    <section className={cn("pb-32", className)}>
      {/* Full Width Hero */}
      <div className="bg-muted py-32">
        <div className="container text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tighter md:text-5xl lg:text-6xl">
            {title}
          </h1>
          {meta && <p className="mt-4 text-sm text-muted-foreground">{meta}</p>}
        </div>
      </div>

      {/* Intro Section */}
      {description && (
        <div className="py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl text-left">
              <p className="text-xl leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="py-16">
        <div className="container">
          <div className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export { LegalArticle };
