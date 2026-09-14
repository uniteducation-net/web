import type { MetadataRoute } from "next";

const siteUrl = (
  process.env.APP_URL ?? "https://uniteducation.net"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The workspace app and API are authenticated/private — keep them out
      // of the index. (The locale redirect at / makes / the only entry point.)
      disallow: ["/api/", "/workspace"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
