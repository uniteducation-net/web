import { BadgeCheck, Landmark } from "lucide-react";
import Link from "next/link";

import { CopyValueButton } from "@/components/copy-value-button";
import { cn } from "@/lib/utils";

interface BankAccountField {
  label: string;
  value: string;
}

interface BankAccountStatus {
  /** Shown verbatim, e.g. the official non-profit status line. */
  text: string;
  /** Optional second line (e.g. an English translation); hidden when empty. */
  translation?: string;
  /** Optional link on `text`, e.g. an article explaining the status. */
  href?: string;
}

interface BankAccountDetailsProps {
  heading: string;
  /** Rows shown in order, each with its own copy button. */
  fields: BankAccountField[];
  copyLabel: string;
  copiedLabel: string;
  /** Badge row at the bottom of the card. */
  status?: BankAccountStatus;
  className?: string;
}

/** Bank transfer details as a centered card with per-field copy buttons. */
const BankAccountDetails = ({
  heading,
  fields,
  copyLabel,
  copiedLabel,
  status,
  className,
}: BankAccountDetailsProps) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 md:p-8",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-muted p-2.5 shadow-sm">
          <Landmark className="size-5 text-muted-foreground" />
        </span>
        <h2 className="font-heading text-heading font-medium">{heading}</h2>
      </div>
      <dl className="mt-4">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 truncate font-mono">{field.value}</dd>
            </div>
            <CopyValueButton
              value={field.value}
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
            />
          </div>
        ))}
      </dl>
      {status && (
        <div className="mt-4 flex items-start gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
          <BadgeCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {status.href ? (
              <Link
                href={status.href}
                className="underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {status.text}
              </Link>
            ) : (
              status.text
            )}
            {status.translation && (
              <span className="block">{status.translation}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export { BankAccountDetails };
