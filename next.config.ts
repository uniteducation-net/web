import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    rules: {
      // Import any .svg as a React component:
      //   global:     import Logo from "@/assets/logo.svg"
      //   co-located: import Diagram from "./diagram.svg" (inside an .mdx file)
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

const withMDX = createMDX({
  // Turbopack requires plugin names as serializable strings, not functions.
  options: {
    remarkPlugins: [
      "remark-frontmatter",
      "remark-mdx-frontmatter",
      "remark-gfm",
    ],
  },
});

export default withMDX(nextConfig);
