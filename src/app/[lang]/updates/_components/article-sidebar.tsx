"use client";

import { ArrowUp, Check, Link2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** lucide-react no longer ships brand icons — these are the simple-icons
 *  paths for the share targets, drawn with fill="currentColor". */
const brandIcons = {
  x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
} as const;

const BrandIcon = ({
  path,
  className,
}: {
  path: string;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d={path} />
  </svg>
);

interface TocItem {
  id: string;
  text: string;
}

interface ArticleSidebarLabels {
  onThisPage: string;
  shareArticle: string;
  backToTop: string;
  copyLink: string;
  linkCopied: string;
}

interface ArticleSidebarProps {
  /** DOM id of the wrapper around the rendered article body — the TOC is
   *  built from the `h2` headings found inside it. */
  contentId: string;
  /** Article title, used as the text when sharing. */
  shareTitle: string;
  labels: ArticleSidebarLabels;
  className?: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

/** Sticky sidebar for the update article: auto-generated "On this page"
 *  scroll-spy TOC, share links, and back-to-top. Rendered for lg screens. */
const ArticleSidebar = ({
  contentId,
  shareTitle,
  labels,
  className,
}: ArticleSidebarProps) => {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // window.location is only available after mount — share hrefs start as
  // "#" during SSR and become real on hydration.
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;

    const headings = Array.from(container.querySelectorAll("h2"));
    const items = headings.map((heading, index) => {
      if (!heading.id) {
        const base =
          slugify(heading.textContent ?? "") || `section-${index + 1}`;
        let id = base;
        let suffix = 2;
        while (document.getElementById(id)) id = `${base}-${suffix++}`;
        heading.id = id;
      }
      return { id: heading.id, text: heading.textContent ?? "" };
    });
    setToc(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { root: null, rootMargin: "0px", threshold: 1 },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [contentId]);

  const shareUrl = () => encodeURIComponent(pageUrl);
  const shareText = () => encodeURIComponent(shareTitle);

  const shareLinks = [
    {
      label: "X (Twitter)",
      icon: brandIcons.x,
      href: () =>
        `https://twitter.com/intent/tweet?url=${shareUrl()}&text=${shareText()}`,
    },
    {
      label: "Facebook",
      icon: brandIcons.facebook,
      href: () =>
        `https://www.facebook.com/sharer/sharer.php?u=${shareUrl()}`,
    },
    {
      label: "LinkedIn",
      icon: brandIcons.linkedin,
      href: () =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl()}`,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions, insecure context) — no-op.
    }
  };

  return (
    <div className={cn("sticky top-8 h-fit", className)}>
      {toc.length > 0 && (
        <>
          <span className="text-lg font-medium">{labels.onThisPage}</span>
          <nav className="mt-4 text-sm">
            <ul className="space-y-1">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={cn(
                      "block py-1 transition-colors duration-200",
                      activeSection === item.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary",
                    )}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
      <Separator className="my-6" />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{labels.shareArticle}</p>
        <ul className="flex gap-2">
          {shareLinks.map((link) => (
            <li key={link.label}>
              <a
                href={pageUrl ? link.href() : "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="inline-flex rounded-full border p-2 transition-colors hover:bg-muted"
              >
                <BrandIcon path={link.icon} className="h-4 w-4" />
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={copyLink}
              aria-label={labels.copyLink}
              title={copied ? labels.linkCopied : labels.copyLink}
              className="inline-flex cursor-pointer rounded-full border p-2 transition-colors hover:bg-muted"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </button>
          </li>
        </ul>
      </div>
      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <ArrowUp className="h-4 w-4" />
          {labels.backToTop}
        </Button>
      </div>
    </div>
  );
};

export { ArticleSidebar };
