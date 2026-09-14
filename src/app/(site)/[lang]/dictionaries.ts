import "server-only";

import type { Locale } from "@/i18n-config";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  de: () => import("./dictionaries/de.json").then((module) => module.default),
};

type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Recursively fills missing keys of `local` from `base` (EN). Locale values
 * always win; arrays and scalars are taken from the locale as-is.
 */
const deepMerge = <T>(base: T, local: unknown): T => {
  if (!isPlainObject(base) || !isPlainObject(local)) {
    return (local === undefined ? base : local) as T;
  }
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(local)) {
    merged[key] = key in base ? deepMerge(base[key as keyof T], value) : value;
  }
  return merged as T;
};

/**
 * Loads the dictionary for `locale`, falling back to EN for any missing key
 * so incomplete locales never render blanks or 404.
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  if (locale === "en") return dictionaries.en();
  const [en, local] = await Promise.all([
    dictionaries.en(),
    dictionaries[locale](),
  ]);
  return deepMerge(en, local);
};
