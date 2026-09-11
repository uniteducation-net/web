import { Image } from "@imagekit/next";
import { Clock, Home } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/i18n-config";
import { cn, formatDate } from "@/lib/utils";

import { ArticleSidebar } from "./article-sidebar";

interface UpdateArticleAuthor {
  name: string;
  /** Team member page slug — the author name links to it. */
  slug: string;
  /** ImageKit path relative to the urlEndpoint. */
  image?: string;
}

interface UpdateArticleLabels {
  updates: string;
  minRead: string;
  onThisPage: string;
  shareArticle: string;
  backToTop: string;
  copyLink: string;
  linkCopied: string;
}

interface UpdateArticleProps {
  lang: Locale;
  title: string;
  /** ISO date, formatted for display inside the component. */
  date: string;
  readingTime: number;
  author?: UpdateArticleAuthor;
  labels: UpdateArticleLabels;
  children: ReactNode;
  className?: string;
}

const BODY_ID = "update-article-body";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Article template for a single update: breadcrumb, author/date/read-time
 *  header, MDX body, and a sticky TOC/share sidebar on lg screens. */
const UpdateArticle = ({
  lang,
  title,
  date,
  readingTime,
  author,
  labels,
  children,
  className,
}: UpdateArticleProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${lang}`} aria-label="Home">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${lang}/updates`}>
                {labels.updates}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mt-7 mb-6 max-w-3xl font-heading text-3xl font-semibold tracking-tighter md:text-5xl">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {author && (
            <>
              <Avatar className="h-8 w-8 overflow-hidden border">
                {author.image ? (
                  <Image
                    src={author.image}
                    alt={author.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback>{initials(author.name)}</AvatarFallback>
                )}
              </Avatar>
              <span>
                <Link
                  href={`/${lang}/team/${author.slug}`}
                  className="font-medium"
                >
                  {author.name}
                </Link>
                <span className="ml-1 text-muted-foreground">
                  on{" "}
                  <time dateTime={date}>{formatDate(date, lang)}</time>
                </span>
              </span>
            </>
          )}
          {!author && (
            <span className="text-muted-foreground">
              <time dateTime={date}>{formatDate(date, lang)}</time>
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {readingTime} {labels.minRead}
          </span>
        </div>
        <Separator className="mt-8 mb-16" />
        <div className="relative grid grid-cols-12 gap-6 lg:grid">
          <div className="col-span-12 lg:col-span-8">
            <div
              id={BODY_ID}
              className="prose prose-neutral max-w-none dark:prose-invert"
            >
              {children}
            </div>
          </div>
          <ArticleSidebar
            contentId={BODY_ID}
            shareTitle={title}
            labels={labels}
            className="col-span-3 col-start-10 hidden lg:block"
          />
        </div>
      </div>
    </section>
  );
};

export { UpdateArticle };
