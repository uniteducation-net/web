import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { NewsletterForm } from "@/components/newsletter-form";
import { cn } from "@/lib/utils";

export interface UpdatesNewsletterPost {
  id: string;
  category: string;
  title: string;
  /** Pre-formatted, localized date string. */
  date: string;
  /** Pre-formatted, localized reading time, e.g. "7 min. read". */
  readTime: string;
  href: string;
}

interface UpdatesNewsletterProps {
  newsletterLabel: string;
  newsletterHeading: string;
  newsletterDescription: string;
  emailPlaceholder: string;
  subscribeLabel: string;
  successLabel: string;
  errorLabel: string;
  disclaimer: string;
  postsLabel: string;
  allPostsLabel: string;
  allPostsHref?: string;
  /** Latest updates, passed in from the server — newest first. */
  posts: UpdatesNewsletterPost[];
  className?: string;
}

/** Newsletter signup card beside a list of the latest updates. Sits between
 *  the Highlights carousel and the full LatestUpdates grid. */
const UpdatesNewsletter = ({
  newsletterLabel,
  newsletterHeading,
  newsletterDescription,
  emailPlaceholder,
  subscribeLabel,
  successLabel,
  errorLabel,
  disclaimer,
  postsLabel,
  allPostsLabel,
  allPostsHref = "#",
  posts,
  className,
}: UpdatesNewsletterProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container mx-auto">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
            <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-7 sm:p-9 lg:col-span-2">
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
                  {newsletterLabel}
                </span>
                <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                  {newsletterHeading}
                </h2>
                <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                  {newsletterDescription}
                </p>
              </div>

              <NewsletterForm
                variant="stacked"
                emailPlaceholder={emailPlaceholder}
                submitLabel={subscribeLabel}
                successLabel={successLabel}
                errorLabel={errorLabel}
              />

              <p className="text-xs text-muted-foreground">{disclaimer}</p>
            </div>

            <div className="flex flex-col gap-2 lg:col-span-3">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
                  {postsLabel}
                </span>
                <a
                  href={allPostsHref}
                  className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {allPostsLabel}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>

              <ul className="flex flex-col divide-y divide-border">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={post.href}
                      className="group flex items-start justify-between gap-4 py-4"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                          {post.category}
                        </span>
                        <h3 className="text-sm font-medium text-balance transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {post.readTime}
                        </span>
                        <time className="text-xs text-muted-foreground tabular-nums">
                          {post.date}
                        </time>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { UpdatesNewsletter };
