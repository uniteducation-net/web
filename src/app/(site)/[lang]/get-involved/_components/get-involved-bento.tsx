import {
  ArrowRight,
  GraduationCap,
  HandCoins,
  HandHeart,
  Handshake,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import type { Locale } from "@/i18n-config";
import { cn } from "@/lib/utils";

/** Same order and icons as the header's Get Involved dropdown;
    the first card is the bento feature cell. */
const CARDS = [
  { route: "/volunteer", icon: HandHeart, feature: true },
  { route: "/partner", icon: Handshake, feature: false },
  { route: "/membership", icon: UserPlus, feature: false },
  { route: "/donate", icon: HandCoins, feature: false },
  { route: "/share-knowledge", icon: GraduationCap, feature: false },
] as const;

interface GetInvolvedBentoProps {
  lang: Locale;
  /** Localized card titles/descriptions (dict.header.getInvolved.items). */
  items: { title: string; description: string }[];
  className?: string;
}

const GetInvolvedBento = ({ lang, items, className }: GetInvolvedBentoProps) => {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-6", className)}>
      {CARDS.map((card, index) => (
        <Link
          key={card.route}
          href={`/${lang}/get-involved${card.route}`}
          className={cn(
            "group flex flex-col justify-between gap-8 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/60 hover:bg-muted/40 md:p-8",
            card.feature ? "md:col-span-2 lg:col-span-4" : "lg:col-span-2",
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                "rounded-lg bg-muted shadow-sm",
                card.feature ? "p-4" : "p-3",
              )}
            >
              <card.icon
                className={cn(
                  "text-muted-foreground transition-colors group-hover:text-foreground",
                  card.feature ? "size-8" : "size-6",
                )}
              />
            </span>
            <ArrowRight className="size-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground" />
          </div>
          <div>
            <h2
              className={cn(
                "font-heading font-medium",
                card.feature ? "text-heading" : "text-lg",
              )}
            >
              {items[index].title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {items[index].description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export { GetInvolvedBento };
