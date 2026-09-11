import { Image } from "@imagekit/next";
import { Globe } from "lucide-react";
import Link from "next/link";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

import { TagList } from "@/components/content/tag-list";
import type { Locale } from "@/i18n-config";
import type { ContentEntry, TeamFrontmatter } from "@/lib/content";

interface TeamCardProps {
  entry: ContentEntry<TeamFrontmatter>;
  locale: Locale;
}

const TeamCard = ({ entry, locale }: TeamCardProps) => {
  const { frontmatter } = entry;
  const links = [
    { url: frontmatter.links?.linkedin, icon: FaLinkedin, label: "LinkedIn" },
    { url: frontmatter.links?.github, icon: FaGithub, label: "GitHub" },
    { url: frontmatter.links?.website, icon: Globe, label: "Website" },
  ].filter((link) => link.url);

  return (
    <article className="group flex flex-col gap-4">
      <Link
        href={`/${locale}/team/${entry.slug}`}
        className="relative block aspect-square overflow-hidden rounded-xl bg-muted"
      >
        {frontmatter.image && (
          <Image
            src={frontmatter.image}
            alt={frontmatter.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-opacity duration-300 group-hover:opacity-0"
          />
        )}
        {frontmatter.hoverImage && (
          <Image
            src={frontmatter.hoverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </Link>
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            <Link href={`/${locale}/team/${entry.slug}`}>
              {frontmatter.name}
            </Link>
          </h2>
          <p className="text-sm text-muted-foreground">{frontmatter.role}</p>
        </div>
        <TagList tags={frontmatter.tags} />
        {links.length > 0 && (
          <ul className="flex gap-1">
            {links.map(({ url, icon: Icon, label }) => (
              <li key={label}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
};

export { TeamCard };
