import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ResourceCardProps {
  href: string;
  title: string;
  description: string;
  /** Demo area replacing the template's image holder — decorative. */
  children: ReactNode;
  className?: string;
}

// Whole-card link shell for the resources landing grid (adopted from the
// feature37 template's cells). The demo area is aria-hidden so animated
// content never enters the link's accessible name.
const ResourceCard = ({
  href,
  title,
  description,
  children,
  className,
}: ResourceCardProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between rounded-lg border border-border bg-muted transition hover:border-primary/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <div aria-hidden="true">{children}</div>
      <div className="p-6">
        <h2 className="font-heading text-heading font-semibold">{title}</h2>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
};

export { ResourceCard };
