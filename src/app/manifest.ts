import type { MetadataRoute } from "next";

import { siteName } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} — Free Training Resources for Educators`,
    short_name: siteName,
    description:
      "Help us combat the global lack of qualified teachers and empower the current ones with the latest tech.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#0d416f",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
