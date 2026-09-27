import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BankAccountDetails } from "@/components/bank-account-details";
import { hasLocale } from "@/i18n-config";
import { getDictionary } from "../../dictionaries";
import { DonateHero } from "./_components/donate-hero";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-involved/donate">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");
  return { title: dict.donatePage.metaTitle };
}

export default async function DonatePage({
  params,
}: PageProps<"/[lang]/get-involved/donate">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const page = dict.donatePage;
  const bank = page.bankDetails;

  return (
    <>
      <DonateHero
        heading={page.heading}
        description={page.description}
        primary={{ text: page.primaryText, url: "https://gofund.me/aaac22b69" }}
        secondary={{ text: page.secondaryText, url: "#bank-details" }}
        image={{ src: "/illustrations/make-it-rain.svg", alt: page.imageAlt }}
      />
      {/* Real account details land here soon — until then every field shows
          the localized "coming soon" placeholder. */}
      <section id="bank-details" className="container scroll-mt-24 pb-16 md:pb-24">
        <BankAccountDetails
          heading={bank.sectionHeading}
          fields={[
            { label: bank.accountHolder, value: bank.comingSoon },
            { label: bank.iban, value: bank.comingSoon },
            { label: bank.bic, value: bank.comingSoon },
            { label: bank.bankName, value: bank.comingSoon },
          ]}
          copyLabel={bank.copyLabel}
          copiedLabel={bank.copiedLabel}
        />
      </section>
    </>
  );
}
