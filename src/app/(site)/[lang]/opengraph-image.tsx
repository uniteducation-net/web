import { ImageResponse } from "next/og";

import { hasLocale } from "@/i18n-config";
import { siteName } from "@/lib/site";
import { getDictionary } from "./dictionaries";

export const alt = "UnitEd — Free Training Resources for Educators";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social card, generated per locale at build time — brand tokens (#0d416f
// deep blue, #4fcfbd teal) so no image asset needs to live on ImageKit.
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "en");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0d416f",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#4fcfbd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "#0d416f",
            }}
          >
            U
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>
            {siteName}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            {dict.homeHero.heading}
          </div>
          <div style={{ fontSize: 30, color: "#4fcfbd", lineHeight: 1.35 }}>
            {dict.homeHero.subtitle}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
