import { Image } from "@imagekit/next";
import Link from "next/link";

import type { Locale } from "@/i18n-config";
import type { ContentEntry, TeamFrontmatter } from "@/lib/content";
import { cn } from "@/lib/utils";

const collaborators = [
  "Bakh",
  "Sylvie",
  "Jacob",
  "Toni",
  "Philippa",
  "Ingo",
  "Kiana",
  "Siavash",
  "Maxi",
];

const IMAGE_SIZES = "(min-width: 640px) 33vw, 50vw";

interface AboutTeamDict {
  heading: string;
  subtitle: string;
  collaboratorsHeading: string;
  join: {
    heading: string;
    text1: string;
    linkText: string;
    text2: string;
  };
}

interface AboutTeamProps {
  members: ContentEntry<TeamFrontmatter>[];
  locale: Locale;
  dict: AboutTeamDict;
  className?: string;
}

const AboutTeam = ({ members, locale, dict, className }: AboutTeamProps) => {
  return (
    <section id="team" className={cn("py-32", className)}>
      <div className="container">
        <h2 className="font-heading text-title font-semibold">
          {dict.heading}
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">{dict.subtitle}</p>
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3">
          {members.map((member) => {
            const { frontmatter, slug } = member;
            return (
              <div className="flex flex-col gap-4" key={slug}>
                <Link
                  href={`/${locale}/team/${slug}`}
                  className="group relative block aspect-[3/4] bg-muted"
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
                <div>
                  <h3 className="text-sm font-medium">
                    <Link
                      href={`/${locale}/team/${slug}`}
                      className="hover:underline"
                    >
                      {frontmatter.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {frontmatter.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-32 grid grid-cols-2 gap-x-6 gap-y-12 text-sm font-medium sm:grid-cols-3">
          <h3>{dict.collaboratorsHeading}</h3>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:col-span-2 sm:grid-cols-3">
            {collaborators.map((collaborator) => (
              <li key={collaborator}>{collaborator}</li>
            ))}
          </ul>
        </div>
        <div className="mt-14 grid grid-cols-3 gap-x-6 gap-y-6 sm:gap-x-12">
          <h3 className="col-span-3 text-sm font-medium sm:col-span-1">
            {dict.join.heading}
          </h3>
          <p className="col-span-3 sm:col-span-2 sm:text-lg">
            {dict.join.text1}
            <Link href={`/${locale}/volunteers`} className="underline">
              {dict.join.linkText}
            </Link>
            {dict.join.text2}
          </p>
        </div>
      </div>
    </section>
  );
};

export { AboutTeam };
