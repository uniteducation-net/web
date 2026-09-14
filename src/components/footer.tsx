import { Heart, Mail } from "lucide-react";
import Link from "next/link";
import { FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

import { FeedbackButton } from "@/components/feedback-button";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n-config";
import { cn } from "@/lib/utils";

// Order matches dict.header.about.items: About-page section anchors first,
// then the FAQs home-page anchor and the Terms route.
const HREFS_ABOUT = [
  "/about#project",
  "/about#mission",
  "/about#values",
  "/about#milestones",
  "/about#team",
  "#faq",
  "/terms",
];

// Order matches dict.header.getInvolved.items; "#" entries are future routes.
const HREFS_GET_INVOLVED = ["/volunteers", "#", "/membership", "#", "#"];

const SOCIAL_LINKS = [
  {
    href: "https://www.youtube.com/@uniteducation-net",
    label: "YouTube",
    Icon: FaYoutube,
  },
  {
    href: "https://www.linkedin.com/company/110151549/",
    label: "LinkedIn",
    Icon: FaLinkedin,
  },
  {
    href: "https://www.instagram.com/unite.education",
    label: "Instagram",
    Icon: FaInstagram,
  },
  { href: "mailto:hello@uniteducation.net", label: "Email", Icon: Mail },
];

interface FooterDict {
  about: { label: string; items: { title: string }[] };
  getInvolved: { label: string; items: { title: string }[] };
  legal: { id: string; title: string }[];
  tagline: string;
  copyright: string;
  licenceNote: string;
  madeWithPre: string;
  madeWithPost: string;
  newsletter: {
    heading: string;
    emailPlaceholder: string;
    submit: string;
    agreePre: string;
    agreePost: string;
  };
}

interface FooterProps {
  className?: string;
  /** Current locale; all internal routes are built as `/${lang}/...`. */
  lang: Locale;
  /** Localized footer labels, composed in the layout from the dictionary. */
  dict: FooterDict;
}
const Footer = ({ className, lang, dict }: FooterProps) => {
  const prefix = `/${lang}`;
  const privacyTitle =
    dict.legal.find((item) => item.id === "privacy")?.title ?? "Privacy Policy";
  const sections = [
    {
      title: dict.about.label,
      links: dict.about.items.map((item, i) => ({
        name: item.title,
        href: `${prefix}${HREFS_ABOUT[i]}`,
      })),
    },
    {
      title: dict.getInvolved.label,
      links: dict.getInvolved.items.map((item, i) => ({
        name: item.title,
        href:
          HREFS_GET_INVOLVED[i] === "#"
            ? "#"
            : `${prefix}${HREFS_GET_INVOLVED[i]}`,
      })),
    },
  ];
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <footer>
          <div className="grid grid-cols-4 justify-between gap-10 lg:grid-cols-6 lg:text-left">
            <div className="col-span-4 flex w-full flex-col gap-6 lg:col-span-2">
              {/* Logo */}
              <div className="flex items-center gap-2 lg:justify-start">
                <Logo className="[&_.logo-text]:text-xl" />
              </div>
              <p className="text-muted-foreground">{dict.tagline}</p>
              <ul className="flex items-center space-x-6">
                {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                  <li
                    key={label}
                    className="font-medium duration-200 hover:scale-110 hover:text-muted-foreground"
                  >
                    <a
                      href={href}
                      aria-label={label}
                      {...(href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      <Icon className="size-6" />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <Link
                    href={`${prefix}/terms/licence`}
                    className="font-medium hover:text-primary"
                  >
                    {dict.copyright}
                  </Link>
                </p>
                <p className="text-xs">{dict.licenceNote}</p>
              </div>
            </div>
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="col-span-2 md:col-span-1">
                <h3 className="mb-5 font-medium">{section.title}</h3>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="font-medium hover:text-primary"
                    >
                      <Link href={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-4 md:col-span-2">
              <h3 className="mb-5 font-medium">{dict.newsletter.heading}</h3>
              <div className="grid gap-1.5">
                <div className="flex w-full items-center space-x-2">
                  <Input
                    type="email"
                    placeholder={dict.newsletter.emailPlaceholder}
                />
                  <Button type="submit">{dict.newsletter.submit}</Button>
                </div>
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {dict.newsletter.agreePre}
                <Link
                  href={`${prefix}/terms/privacy`}
                  className="ml-1 text-primary hover:underline"
                >
                  {privacyTitle}
                </Link>
                {dict.newsletter.agreePost}
              </p>
            </div>
          </div>
          <div className="mt-20 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            <FeedbackButton />
            <p>
              <Link href={`${prefix}/about#team`} className="hover:text-primary">
                {dict.madeWithPre}{" "}
                <Heart
                  aria-label="love"
                  className="inline size-4 fill-current text-red-500"
                />{" "}
                {dict.madeWithPost}
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer };
