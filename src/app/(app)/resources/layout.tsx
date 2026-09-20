import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "../../globals.css";

// Root layout for the public resources explorer subtree. Sibling of the
// workspace root layout (same multiple-root-layout mechanism), but public
// and indexable, and scrollable (min-h-dvh) so the reader page can scroll —
// the explorer clamps itself to h-dvh in its own shell.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://uniteducation.net"),
  title: {
    default: "Resources — UnitEd",
    template: "%s — UnitEd Resources",
  },
  description:
    "Explore the UnitEd open teaching-resources collection as an interactive graph.",
  openGraph: { siteName: "UnitEd", type: "website" },
};

export default function ResourcesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-dvh bg-background text-foreground">{children}</body>
    </html>
  );
}
