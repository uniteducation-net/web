"use client";

// Small floating preview for the selected doc — shown for both tree and
// graph clicks. Title, folder/type badges, excerpt, and a "Read more" link
// to the full reader page.

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import type { ResourceDocMeta } from "@/lib/resources-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NodePreviewCardProps {
  doc: ResourceDocMeta;
  linkCount: number;
  onClose: () => void;
  className?: string;
}

export function NodePreviewCard({
  doc,
  linkCount,
  onClose,
  className,
}: NodePreviewCardProps) {
  return (
    <div
      className={cn(
        "w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background p-4 shadow-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold text-secondary">
          {doc.title}
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close preview"
          onClick={onClose}
          className="-mr-1 -mt-1 shrink-0"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="font-normal">
          {doc.folder || "root"}
        </Badge>
        {doc.type && (
          <Badge variant="outline" className="font-normal capitalize">
            {doc.type}
          </Badge>
        )}
        {doc.category && doc.category !== "none" && (
          <Badge variant="outline" className="font-normal">
            {doc.category}
          </Badge>
        )}
        {linkCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {linkCount} {linkCount === 1 ? "link" : "links"}
          </span>
        )}
      </div>

      {doc.excerpt && (
        <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">
          {doc.excerpt}
        </p>
      )}

      <Button asChild size="sm" className="mt-3">
        <Link href={doc.href}>
          Read more
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
