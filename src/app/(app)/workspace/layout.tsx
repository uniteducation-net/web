import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Workspace — UnitEd",
  description: "Your personal ICM teaching workspace.",
  // Private authenticated area — never indexable.
  robots: { index: false, follow: false },
};

export default function WorkspaceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="h-dvh overflow-hidden bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
