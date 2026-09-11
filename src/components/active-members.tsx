import { Image } from "@imagekit/next";
import { UserPlus } from "lucide-react";
import Link from "next/link";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Locale } from "@/i18n-config";
import type { ContentEntry, TeamFrontmatter } from "@/lib/content";
import { cn } from "@/lib/utils";

interface ActiveMembersDict {
  heading: string;
  cta: {
    title: string;
    text: string;
  };
}

interface ActiveMembersProps {
  /** Team entries, already filtered to active members and sorted by `order`. */
  members: ContentEntry<TeamFrontmatter>[];
  locale: Locale;
  dict: ActiveMembersDict;
  className?: string;
}

const IMAGE_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 85vw";
const ITEM_CLASS = "basis-[85%] pl-4 sm:basis-[45%] lg:basis-1/3 lg:pl-6";

const ActiveMembers = ({
  members,
  locale,
  dict,
  className,
}: ActiveMembersProps) => {
  // The join-CTA card takes one random slot among the members (server-side,
  // once per render — no client JS needed for the shuffle).
  const items: (ContentEntry<TeamFrontmatter> | "cta")[] = [...members];
  items.splice(Math.floor(Math.random() * (items.length + 1)), 0, "cta");

  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <h2 className="mb-10 text-center font-heading text-3xl font-semibold tracking-tight md:text-5xl">
          {dict.heading}
        </h2>

        <div className="relative">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 lg:-ml-6">
              {items.map((item) =>
                item === "cta" ? (
                  <CarouselItem key="join-cta" className={ITEM_CLASS}>
                    <Link
                      href={`/${locale}/get-involved`}
                      className="group flex h-full min-h-96 flex-col items-center justify-center gap-5 rounded-xl border-2 border-primary bg-primary/5 p-6 text-center transition-colors duration-300 hover:bg-primary/10"
                    >
                      <span className="flex size-20 items-center justify-center rounded-full border-2 border-primary bg-background transition-transform duration-300 group-hover:scale-110">
                        <UserPlus className="size-9 text-logo-unit" />
                      </span>
                      <span className="text-xl font-semibold tracking-tight">
                        {dict.cta.title}
                      </span>
                      <span className="whitespace-pre-line text-sm text-muted-foreground">
                        {dict.cta.text}
                      </span>
                    </Link>
                  </CarouselItem>
                ) : (
                  <CarouselItem key={item.slug} className={ITEM_CLASS}>
                    <MemberCard entry={item} locale={locale} />
                  </CarouselItem>
                ),
              )}
            </CarouselContent>

            <div className="mt-8 flex justify-center gap-3">
              <CarouselPrevious className="static size-10 translate-x-0 translate-y-0 rounded-lg [&>svg]:size-4" />
              <CarouselNext className="static size-10 translate-x-0 translate-y-0 rounded-lg [&>svg]:size-4" />
            </div>
          </Carousel>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-background to-transparent lg:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-background to-transparent lg:w-24" />
        </div>
      </div>
    </section>
  );
};

const MemberCard = ({
  entry,
  locale,
}: {
  entry: ContentEntry<TeamFrontmatter>;
  locale: Locale;
}) => {
  const { frontmatter } = entry;
  const profileHref = `/${locale}/team/${entry.slug}`;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <Link
        href={profileHref}
        className="group relative block aspect-square bg-muted"
      >
        {frontmatter.image && (
          <Image
            src={frontmatter.image}
            alt={frontmatter.name}
            fill
            sizes={IMAGE_SIZES}
            className={cn(
              "object-cover object-top transition-opacity duration-300",
              frontmatter.hoverImage && "group-hover:opacity-0",
            )}
          />
        )}
        {frontmatter.hoverImage && (
          <Image
            src={frontmatter.hoverImage}
            alt=""
            fill
            sizes={IMAGE_SIZES}
            className="object-cover object-top opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col justify-between gap-6 p-6">
        {frontmatter.whyUnited ? (
          <blockquote className="flex-1 text-base leading-snug font-medium lg:text-lg">
            {frontmatter.whyUnited}
          </blockquote>
        ) : (
          <div className="flex-1" />
        )}
        <div>
          <div className="text-sm font-semibold">
            <Link href={profileHref} className="hover:underline">
              {frontmatter.name}
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            {frontmatter.role}
          </div>
        </div>
      </div>
    </div>
  );
};

export { ActiveMembers };
