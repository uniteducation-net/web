import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConsentAnalytics } from "@/components/consent-analytics";
import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ImageKitClientProvider } from "@/components/imagekit-provider";
import { hasLocale, i18n } from "@/i18n-config";
import { fontVariables } from "@/lib/fonts";
import { siteName, siteUrl } from "@/lib/site";
import { getDictionary } from "./dictionaries";
import "../../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `UnitEd — ${dict.homeHero.heading}`,
      template: `%s — UnitEd`,
    },
    description: dict.homeHero.subtitle,
    openGraph: {
      siteName,
      type: "website",
      locale: lang === "de" ? "de_DE" : "en_US",
    },
    twitter: { card: "summary_large_image" },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: `${siteUrl}/icon.png`,
        email: "hello@uniteducation.net",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: [...i18n.locales],
      },
    ],
  };

  return (
    <html
      lang={lang}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ImageKitClientProvider>
          <Header
            dict={dict.header}
            languageLabel={dict.common.language}
            aboutHref={`/${lang}/about`}
            updatesHref={`/${lang}/updates`}
            getInvolvedHref={`/${lang}/get-involved`}
          />
          <main className="flex-1">{children}</main>
          <Footer
            lang={lang}
            dict={{
              about: dict.header.about,
              getInvolved: dict.header.getInvolved,
              legal: dict.legalOverview.items,
              tagline: dict.homeHero.subtitle,
              ...dict.footer,
            }}
          />
          <CookieBanner
            {...dict.cookieBanner}
            privacyHref={`/${lang}/terms/privacy`}
          />
        </ImageKitClientProvider>
        <ConsentAnalytics />
      </body>
    </html>
  );
}
