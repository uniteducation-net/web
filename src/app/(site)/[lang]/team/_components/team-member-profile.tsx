import { Image } from "@imagekit/next";
import { Globe, Home } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

import { TagList } from "@/components/content/tag-list";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Locale } from "@/i18n-config";
import type { ContentEntry, TeamFrontmatter } from "@/lib/content";
import { cn } from "@/lib/utils";

interface TeamMemberProfileLabels {
  team: string;
  whyUnited: string;
  bio: string;
  other: string;
}

interface TeamMemberProfileProps {
  lang: Locale;
  entry: ContentEntry<TeamFrontmatter>;
  labels: TeamMemberProfileLabels;
  className?: string;
}

/** Frontmatter text sections hold multi-paragraph text separated by
 *  newlines — split into individual paragraphs. */
const Paragraphs = ({ text }: { text: string }) => (
  <>
    {text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => (
        // Static content, order never changes — index key is safe here.
        <p key={index} className="leading-relaxed text-muted-foreground">
          {line}
        </p>
      ))}
  </>
);

const Section = ({
  heading,
  text,
}: {
  heading: string;
  text: string;
}) => (
  <section className="flex flex-col gap-3">
    <h2 className="font-heading text-2xl font-semibold tracking-tight">
      {heading}
    </h2>
    <Paragraphs text={text} />
  </section>
);

/** Profile page for a single team member: breadcrumb, portrait with hover
 *  swap, name/role/links hero, and the frontmatter sections (whyUnited, bio,
 *  other) followed by any MDX body. */
const TeamMemberProfile = ({
  lang,
  entry,
  labels,
  className,
}: TeamMemberProfileProps) => {
  const { frontmatter, Content } = entry;
  const links = [
    { url: frontmatter.links?.linkedin, icon: FaLinkedin, label: "LinkedIn" },
    { url: frontmatter.links?.github, icon: FaGithub, label: "GitHub" },
    { url: frontmatter.links?.website, icon: Globe, label: "Website" },
  ].filter((link) => link.url);

  const sections: { heading: string; text?: string }[] = [
    { heading: labels.whyUnited, text: frontmatter.whyUnited },
    { heading: labels.bio, text: frontmatter.bio },
    { heading: labels.other, text: frontmatter.other },
  ];

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
              <BreadcrumbLink href={`/${lang}/team`}>
                {labels.team}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{frontmatter.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-12 grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-5">
            {frontmatter.image && (
              <div className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                <Image
                  src={frontmatter.image}
                  alt={frontmatter.name}
                  fill
                  priority
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className={cn(
                    "object-cover object-top transition-opacity duration-300",
                    frontmatter.hoverImage && "group-hover:opacity-0",
                  )}
                />
                {frontmatter.hoverImage && (
                  <Image
                    src={frontmatter.hoverImage}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 40vw, 100vw"
                    className="object-cover object-top opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 md:col-span-7">
            <h1 className="font-heading text-3xl font-semibold tracking-tighter md:text-5xl">
              {frontmatter.name}
            </h1>
            <p className="text-lg text-muted-foreground">{frontmatter.role}</p>
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
        </div>

        <div className="mt-16 flex max-w-3xl flex-col gap-10">
          {sections.map(
            ({ heading, text }) =>
              text && <Section key={heading} heading={heading} text={text} />,
          )}
        </div>

        <div className="prose prose-neutral mt-16 max-w-none dark:prose-invert">
          <Content />
        </div>
      </div>
    </section>
  );
};

export { TeamMemberProfile };
export type { TeamMemberProfileLabels };
