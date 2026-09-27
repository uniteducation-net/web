import createMDX from "@next/mdx";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Production security headers. The CSP is intentionally pragmatic for a
// Next.js app without nonce infrastructure: inline scripts/styles are
// allowed (Next bootstraps inline), 'wasm-unsafe-eval' covers the Rive
// WebGL2 runtime. Clickjacking is closed via frame-ancestors, and the
// remaining directives are tight (object/base/form/self-only).
const contentSecurityPolicy = [
  "default-src 'self'",
  // va.vercel-scripts.com is dev-only: Vercel Analytics' debug script + event
  // beacon. Production loads same-origin (/_vercel/insights/*) — covered by
  // 'self' — and consent-gated via beforeSend (see consent-analytics.tsx).
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://tally.so${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // ImageKit = site media, ytimg = hero video poster (consent-gated),
  // githubavatars = session avatars, data/blob = inline assets.
  "img-src 'self' data: blob: https://ik.imagekit.io https://i.ytimg.com https://avatars.githubusercontent.com",
  "media-src 'self' blob: https://ik.imagekit.io",
  "font-src 'self' data:",
  `connect-src 'self' https://ik.imagekit.io${isDev ? " ws: https://va.vercel-scripts.com" : ""}`,
  "worker-src 'self' blob:",
  // tally.so = embedded forms (full-page iframes + the lazy feedback popup).
  "frame-src 'self' https://www.youtube-nocookie.com https://tally.so",
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
  experimental: {
    // No single root layout exists (route groups + [lang] dynamic segment),
    // so unmatched URLs are served by src/app/global-not-found.tsx.
    globalNotFound: true,
  },
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

// withBotId (outermost) adds same-origin proxy rewrites for the Vercel BotID
// challenge so ad-blockers can't break it. Those rewrites keep the challenge
// under 'self', so the CSP above needs no BotID exceptions.
export default withBotId(withMDX(nextConfig));
