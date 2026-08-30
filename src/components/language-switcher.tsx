"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { i18n, localeNames, type Locale } from "@/i18n-config";

interface LanguageSwitcherProps {
  /** Localized chrome label from the dictionary, e.g. "Language" / "Sprache". */
  languageLabel: string;
}

const LanguageSwitcher = ({ languageLabel }: LanguageSwitcherProps) => {
  const { lang } = useParams<{ lang: Locale }>();
  const pathname = usePathname();

  // Path without the leading locale segment, e.g. "/en/about" -> "/about"
  const pathWithoutLocale = pathname.replace(/^\/[^/]+/, "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={languageLabel}>
          <Globe className="size-4" />
          {localeNames[lang]}
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{languageLabel}</DropdownMenuLabel>
        {i18n.locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link href={`/${locale}${pathWithoutLocale}`}>
              <span className="flex-1">{localeNames[locale]}</span>
              {locale === lang && <Check className="size-4" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { LanguageSwitcher };
