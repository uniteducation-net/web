"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface CopyValueButtonProps {
  /** Text written to the clipboard on click. */
  value: string;
  /** Accessible label / tooltip before copying. */
  copyLabel: string;
  /** Tooltip shown briefly after a successful copy. */
  copiedLabel: string;
  className?: string;
}

/** Copies `value` to the clipboard, swapping the icon to a check for 2s.
    Same pattern as the article sidebar's copy-link button — no toast lib. */
const CopyValueButton = ({
  value,
  copyLabel,
  copiedLabel,
  className,
}: CopyValueButtonProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions, insecure context) — no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copyLabel}
      title={copied ? copiedLabel : copyLabel}
      className={cn(
        "inline-flex shrink-0 cursor-pointer rounded-full border border-border p-2 transition-colors hover:bg-muted",
        className,
      )}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
};

export { CopyValueButton };
