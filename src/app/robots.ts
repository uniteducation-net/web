import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

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
