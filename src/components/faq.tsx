import Link from "next/link";
import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Locale } from "@/i18n-config";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

interface FaqDict {
  heading: string;
  categories: FaqCategory[];
}

interface FaqProps {
  className?: string;
  /** Localized FAQ copy, from the dictionary. */
  dict: FaqDict;
  lang: Locale;
}

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

const linkClassName = "underline underline-offset-4 hover:text-primary";

/**
 * Renders `[label](href)` markdown links inside dictionary text.
 * Root-relative hrefs get the locale prefix; mailto/external stay as-is.
 */
const renderInline = (text: string, lang: Locale): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const [raw, label, href] = match;
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      href.startsWith("/") ? (
        <Link
          key={match.index}
          href={`/${lang}${href}`}
          className={linkClassName}
        >
          {label}
        </Link>
      ) : (
        <a key={match.index} href={href} className={linkClassName}>
          {label}
        </a>
      ),
    );
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

/**
 * Splits an answer into paragraphs; consecutive lines starting with "- "
 * become a bullet list.
 */
const AnswerBody = ({ answer, lang }: { answer: string; lang: Locale }) => {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={blocks.length} className="list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{renderInline(item, lang)}</li>
        ))}
      </ul>,
    );
  };

  for (const line of answer.split("\n")) {
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
    } else {
      flushBullets();
      blocks.push(<p key={blocks.length}>{renderInline(line, lang)}</p>);
    }
  }
  flushBullets();

  return <div className="space-y-2">{blocks}</div>;
};

const Faq = ({ className, dict, lang }: FaqProps) => {
  return (
    <section id="faq" className={cn("py-32", className)}>
      <div className="container">
        <h2 className="mb-8 font-heading text-title font-semibold md:mb-11">
          {dict.heading}
        </h2>
        {dict.categories.map((category, categoryIndex) => (
          <div
            key={category.title}
            className={cn(
              "grid gap-4 border-t pt-4 md:grid-cols-3 md:gap-10",
              categoryIndex > 0 && "mt-10",
            )}
          >
            <h3 className="text-xl font-medium">{category.title}</h3>
            <Accordion type="multiple" className="md:col-span-2">
              {category.items.map((faq, index) => (
                <AccordionItem key={faq.question} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <AnswerBody answer={faq.answer} lang={lang} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
};

export { Faq };
