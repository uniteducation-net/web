export const i18n = {
  defaultLocale: "en",
  locales: ["en", "de"],
} as const;

export type Locale = (typeof i18n)["locales"][number];

export const hasLocale = (locale: string): locale is Locale =>
  (i18n.locales as readonly string[]).includes(locale);

/** Autonyms for the language switcher UI — not translated content. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};
