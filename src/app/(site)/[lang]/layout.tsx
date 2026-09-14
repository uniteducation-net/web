import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ImageKitClientProvider } from "@/components/imagekit-provider";
import { hasLocale, i18n } from "@/i18n-config";
import { fontVariables } from "@/lib/fonts";
import { getDictionary } from "./dictionaries";
import "../../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return {
    metadataBase: new URL(
      process.env.APP_URL ?? "https://uniteducation.net",
    ),
    title: {
      default: `UnitEd — ${dict.homeHero.heading}`,
      template: `%s — UnitEd`,
    },
    description: dict.homeHero.subtitle,
    openGraph: { siteName: "UnitEd", type: "website" },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ImageKitClientProvider>
          <Header
            dict={dict.header}
            languageLabel={dict.common.language}
            aboutHref={`/${lang}/about`}
            updatesHref={`/${lang}/updates`}
            membershipHref={`/${lang}/membership`}
          />
          {children}
          <Footer
            teamHref={`/${lang}/about#team`}
            licenceHref={`/${lang}/terms/licence`}
          />
          <CookieBanner {...dict.cookieBanner} />
        </ImageKitClientProvider>
      </body>
    </html>
  );
}
