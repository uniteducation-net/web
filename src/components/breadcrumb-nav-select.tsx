"use client";

import { useRouter } from "next/navigation";

import type { BreadcrumbNavItem } from "@/components/breadcrumb-nav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BreadcrumbNavSelectProps {
  options: BreadcrumbNavItem[];
  /** href of the option matching the current page. */
  selectedHref?: string;
}

const BreadcrumbNavSelect = ({
  options,
  selectedHref,
}: BreadcrumbNavSelectProps) => {
  const router = useRouter();

  return (
    <Select value={selectedHref} onValueChange={(href) => router.push(href)}>
      <SelectTrigger className="h-auto w-auto px-2 py-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.href} value={option.href}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { BreadcrumbNavSelect };
