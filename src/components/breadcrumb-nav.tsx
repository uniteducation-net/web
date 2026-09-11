import { Home } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { BreadcrumbNavSelect } from "@/components/breadcrumb-nav-select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface BreadcrumbNavItem {
  label: string;
  href: string;
}

interface BreadcrumbNavProps {
  /** Accessible label for the home icon link. */
  homeLabel: string;
  homeHref: string;
  /** Ancestor segments rendered as links between home and the current page. */
  items?: BreadcrumbNavItem[];
  /** Current page label. Omit when `options` is set — the select then marks the current page. */
  current?: string;
  /** Sibling pages offered as a dropdown, replacing `current` (e.g. all legal docs). */
  options?: BreadcrumbNavItem[];
  /** href of the option matching the current page. */
  selectedHref?: string;
  className?: string;
}

const BreadcrumbNav = ({
  homeLabel,
  homeHref,
  items = [],
  current,
  options,
  selectedHref,
  className,
}: BreadcrumbNavProps) => {
  const hasDropdown = !!options?.length;

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={homeHref} aria-label={homeLabel}>
              <Home className="size-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item) => (
          <Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={item.href}>{item.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {hasDropdown ? (
            <BreadcrumbNavSelect options={options} selectedHref={selectedHref} />
          ) : (
            <BreadcrumbPage>{current}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export { BreadcrumbNav };
export type { BreadcrumbNavItem, BreadcrumbNavProps };
