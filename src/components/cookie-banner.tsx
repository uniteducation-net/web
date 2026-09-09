"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  categories: CookieCategory[];
  rejectText: string;
  customizeText: string;
  hideText: string;
  acceptText: string;
  saveText: string;
  defaultVisible?: boolean;
  defaultEnabled?: Record<string, boolean>;
  className?: string;
}

type Props = Partial<CookieBannerProps>;

const defaultCategories: CookieCategory[] = [
  {
    id: "essential",
    label: "Essential",
    description: "Required for the site to function.",
    required: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Helps us understand how visitors use the site.",
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Used for relevant promotions and campaign measurement.",
  },
];

const defaultProps: CookieBannerProps = {
  title: "Cookie settings",
  description: "Accept all or expand to choose categories.",
  categories: defaultCategories,
  rejectText: "Reject",
  customizeText: "Customize",
  hideText: "Hide",
  acceptText: "Accept all",
  saveText: "Save",
  defaultVisible: true,
  defaultEnabled: {
    essential: true,
    analytics: false,
    marketing: false,
  },
};

const CookieBanner = (props: Props) => {
  const {
    title,
    description,
    categories,
    rejectText,
    customizeText,
    hideText,
    acceptText,
    saveText,
    defaultVisible,
    defaultEnabled,
    className,
  } = { ...defaultProps, ...props };

  const [visible, setVisible] = useState(defaultVisible);
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    defaultEnabled ?? {},
  );

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-2xl",
        className,
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
          {rejectText}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? hideText : customizeText}
        </Button>
        <Button size="sm" onClick={() => setVisible(false)}>
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
                  checked={enabled[cat.id] ?? false}
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
              onClick={() => setVisible(false)}
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
