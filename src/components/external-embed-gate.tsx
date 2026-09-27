"use client";

import { FileText } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { grantExternalForSession, useConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

interface ExternalEmbedGateProps {
  /** Explains which third party provides the content and what loading shares. */
  text: string;
  buttonLabel: string;
  children: ReactNode;
  /** Sizing contract of the embed container (e.g. "absolute inset-0"). */
  className?: string;
}

/**
 * Consent gate for third-party embeds (the "external" category — see
 * src/lib/consent.ts). Renders children only once external content is
 * allowed; until then a placeholder whose button grants it — a deliberate
 * click = consenting to this content.
 */
const ExternalEmbedGate = ({
  text,
  buttonLabel,
  children,
  className,
}: ExternalEmbedGateProps) => {
  const { external } = useConsent();

  if (external) return <>{children}</>;

  return (
    <div className={cn("grid place-items-center", className)}>
      <div className="flex max-w-md flex-col items-center gap-4 p-6 text-center">
        <FileText aria-hidden className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{text}</p>
        <Button type="button" onClick={grantExternalForSession}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
};

export { ExternalEmbedGate };
