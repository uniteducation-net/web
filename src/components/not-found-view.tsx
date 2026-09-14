"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { openTallyPopup } from "@/components/feedback-button";
import { IllustrationImage } from "@/components/illustration-image";
import { Button } from "@/components/ui/button";

/**
 * `not-found.tsx` receives no props, so the locale can't be read server-side.
 * The view picks it up from `<html lang>` (set by the layout that wraps it)
 * on mount, falling back to English — e.g. for `global-not-found.tsx`, which
 * renders with no layout at all.
 */
const STRINGS = {
  en: {
    title: "Page not found",
    lead: "The page you're looking for doesn't exist or has moved.",
    feedback: "Send feedback",
    back: "Go back",
    home: "Go to homepage",
    illustrationAlt: "Illustration of missing files",
  },
  de: {
    title: "Seite nicht gefunden",
    lead: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    feedback: "Feedback senden",
    back: "Zurück",
    home: "Zur Startseite",
    illustrationAlt: "Illustration fehlender Dateien",
  },
} as const;

type Locale = keyof typeof STRINGS;

const noopSubscribe = () => () => {};

/** Client snapshot: locale from `<html lang>`, English if unknown. */
const getClientLocale = (): Locale => {
  const docLang = document.documentElement.lang;
  return docLang in STRINGS ? (docLang as Locale) : "en";
};

/** Server/hydration snapshot: English; the client re-renders if it differs. */
const getServerLocale = (): Locale => "en";

interface NotFoundViewProps {
  homeHref: string;
  /** Pin the locale when the caller knows it; otherwise read from `<html lang>`. */
  lang?: Locale;
}

const NotFoundView = ({ homeHref, lang }: NotFoundViewProps) => {
  const router = useRouter();
  const detected = useSyncExternalStore(
    noopSubscribe,
    getClientLocale,
    getServerLocale,
  );
  const locale = lang ?? detected;

  const t = STRINGS[locale];

  return (
    <section className="container flex min-h-[70vh] flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
      <IllustrationImage
        src="/illustrations/files-missing.svg"
        alt={t.illustrationAlt}
        priority
        className="mx-auto aspect-square w-full max-w-xs"
      />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-title font-semibold">{t.title}</h1>
        <p className="text-lead text-muted-foreground">{t.lead}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={() => void openTallyPopup()}>
          {t.feedback}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => router.back()}>
          {t.back}
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href={homeHref}>{t.home}</Link>
        </Button>
      </div>
    </section>
  );
};

export { NotFoundView };
