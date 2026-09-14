import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Production security headers. The CSP is intentionally pragmatic for a
// Next.js app without nonce infrastructure: inline scripts/styles are
// allowed (Next bootstraps inline), 'wasm-unsafe-eval' covers the Rive
// WebGL2 runtime. Clickjacking is closed via frame-ancestors, and the
// remaining directives are tight (object/base/form/self-only).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // ImageKit = site media, ytimg = hero video poster, githubavatars = session
  // avatars, cloudfront = shadcn block portraits, data/blob = inline assets.
  "img-src 'self' data: blob: https://ik.imagekit.io https://i.ytimg.com https://avatars.githubusercontent.com https://deifkwefumgah.cloudfront.net",
  "media-src 'self' blob: https://ik.imagekit.io",
  "font-src 'self' data:",
  `connect-src 'self' https://ik.imagekit.io${isDev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // legacy fallback for frame-ancestors
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // HTTPS-only at the edge (Vercel); harmless in dev.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
