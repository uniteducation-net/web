import { Landmark } from "lucide-react";

import { CopyValueButton } from "@/components/copy-value-button";
import { cn } from "@/lib/utils";

interface BankAccountField {
  label: string;
  value: string;
}

interface BankAccountDetailsProps {
  heading: string;
  /** Rows shown in order, each with its own copy button. */
  fields: BankAccountField[];
  copyLabel: string;
  copiedLabel: string;
  className?: string;
}

/** Bank transfer details as a centered card with per-field copy buttons. */
const BankAccountDetails = ({
  heading,
  fields,
  copyLabel,
  copiedLabel,
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
    </div>
  );
};

export { BankAccountDetails };
