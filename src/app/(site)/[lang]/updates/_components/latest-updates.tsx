import Link from "next/link";

import { IllustrationImage } from "@/components/illustration-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface LatestUpdatePost {
  slug: string;
  title: string;
  summary: string;
  /** First tag of the post, shown as a badge. */
  label?: string;
  /** Pre-formatted, localized date string. */
  published: string;
  href: string;
  /** ImageKit path relative to the urlEndpoint. */
  image?: string;
}

interface LatestUpdatesProps {
  heading: string;
  description: string;
  posts: LatestUpdatePost[];
  className?: string;
}

/** Grid of all updates, newest first, under the Highlights carousel. */
const LatestUpdates = ({
  heading,
  description,
  posts,
  className,
}: LatestUpdatesProps) => {
  return (
    <section className={cn("py-16", className)}>
      <div className="container mx-auto">
        <div className="mb-12 max-w-2xl md:mb-16">
          <h2 className="mb-4 text-4xl font-medium tracking-tight md:text-5xl">
            {heading}
          </h2>
          <p className="text-muted-foreground md:text-lg">{description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={post.href}
              className="group flex flex-col gap-6"
            >
              {post.image && (
                <IllustrationImage
                  src={post.image}
                  alt={post.title}
                  className="aspect-16/10 rounded-md"
                  imageClassName="object-contain object-center transition duration-300 group-hover:scale-105"
                />
              )}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  {post.label && <Badge variant="outline">{post.label}</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {post.published}
                  </span>
                </div>
                <h3 className="text-xl font-medium tracking-tight">
                  {post.title}
                </h3>
                <p className="line-clamp-2 pb-4 text-sm text-muted-foreground">
                  {post.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export { LatestUpdates };
