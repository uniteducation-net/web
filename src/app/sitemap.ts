import type { MetadataRoute } from "next";
import { i18n } from "@/i18n-config";
import { getSlugs, type ContentType } from "@/lib/content";

const siteUrl = (
  process.env.APP_URL ?? "https://uniteducation.net"
).replace(/\/+$/, "");

const STATIC_ROUTES = [
  "",
  "/about",
  "/team",
  "/updates",
  "/events",
  "/membership",
  "/terms",
];

const CONTENT_TYPES: ContentType[] = ["team", "updates", "events", "terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const lang of i18n.locales) {
    for (const route of STATIC_ROUTES) {
      entries.push({
        url: `${siteUrl}/${lang}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1 : 0.7,
      });
    }
    for (const type of CONTENT_TYPES) {
      for (const slug of getSlugs(type)) {
        entries.push({
          url: `${siteUrl}/${lang}/${type}/${slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    }
  }

  return entries;
}
