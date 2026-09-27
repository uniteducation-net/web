"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  acceptAll,
  rejectAll,
  setConsent,
  useConsent,
} from "@/lib/consent";
import { cn } from "@/lib/utils";

interface CookieCategory {
  id: string;
  label: string;
  description: string;
  required?: boolean;
}

interface CookieBannerProps {
  title: string;
  description: string;
  /** Label of the privacy-policy link rendered under the description. */
  privacyLinkText: string;
  categories: CookieCategory[];
  rejectText: string;
  customizeText: string;
  hideText: string;
  acceptText: string;
  saveText: string;
  /** Localized privacy-policy route, passed by the layout (not the dict). */
  privacyHref: string;
  className?: string;
}

type CookieBannerCardProps = CookieBannerProps & {
  /** Stored choices the toggles seed from. */
  initialAnalytics: boolean;
  initialExternal: boolean;
};

const CookieBanner = (props: CookieBannerProps) => {
  const consent = useConsent();
  // Hidden until a choice is due; re-opened anytime via the footer entry.
  const visible = consent.settingsOpen || !consent.decided;

  if (!visible) return null;

  // The key remounts the card when the stored record changes while open
  // (e.g. a click-to-load grant behind the banner), reseeding the toggles;
  // hiding unmounts it, so reopening always shows the current choices.
  return (
    <CookieBannerCard
      key={`${consent.analytics}.${consent.external}`}
      {...props}
      initialAnalytics={consent.analytics}
      initialExternal={consent.external}
    />
  );
};

const CookieBannerCard = ({
  title,
  description,
  privacyLinkText,
  categories,
  rejectText,
  customizeText,
  hideText,
  acceptText,
  saveText,
  privacyHref,
  className,
  initialAnalytics,
  initialExternal,
}: CookieBannerCardProps) => {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    analytics: initialAnalytics,
    external: initialExternal,
  });

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-2xl",
        className,
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        <Link href={privacyHref} className="text-primary hover:underline">
          {privacyLinkText}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={rejectAll}>
          {rejectText}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? hideText : customizeText}
        </Button>
        <Button size="sm" onClick={acceptAll}>
          {acceptText}
        </Button>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-border pt-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
                <Switch
                  checked={cat.required || (enabled[cat.id] ?? false)}
                  disabled={cat.required}
                  onCheckedChange={(checked) =>
                    setEnabled((prev) => ({ ...prev, [cat.id]: checked }))
                  }
                  aria-label={cat.label}
                />
              </div>
            ))}
            <Button
              size="sm"
              className="w-full"
              onClick={() =>
                setConsent({
                  analytics: enabled.analytics ?? false,
                  external: enabled.external ?? false,
                })
              }
            >
              {saveText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CookieBanner };
export type { CookieBannerProps, CookieCategory };
