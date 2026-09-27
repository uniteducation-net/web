import type { Metadata } from "next";
import { ConsentAnalytics } from "@/components/consent-analytics";
import { fontVariables } from "@/lib/fonts";
import { siteName, siteUrl } from "@/lib/site";
import "../../globals.css";

// Root layout for the public resources explorer subtree. Sibling of the
// workspace root layout (same multiple-root-layout mechanism), but public
// and indexable, and scrollable (min-h-dvh) so the reader page can scroll —
// the explorer clamps itself to h-dvh in its own shell.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Resources — UnitEd",
    template: "%s — UnitEd Resources",
  },
  description:
    "Explore the UnitEd open teaching-resources collection as an interactive graph.",
  openGraph: { siteName, type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function ResourcesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-dvh bg-background text-foreground">
        {children}
        <ConsentAnalytics />
      </body>
    </html>
  );
}
