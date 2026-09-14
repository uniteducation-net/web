import type { Metadata } from "next";

import { ImageKitClientProvider } from "@/components/imagekit-provider";
import { NotFoundView } from "@/components/not-found-view";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The page you are looking for does not exist.",
};

/**
 * Global 404 for URLs that match no route at all (e.g. outside the locale
 * funnel). Bypasses every layout, so it must return a full document and
 * import globals/fonts itself. No locale context exists here — English only.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">
        <ImageKitClientProvider>
          <NotFoundView homeHref="/" lang="en" />
        </ImageKitClientProvider>
      </body>
    </html>
  );
}
