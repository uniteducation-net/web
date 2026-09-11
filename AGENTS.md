<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tech Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · MDX · pnpm

# Rules

- SSR and performance first — add `"use client"` only when strictly necessary.
- All media lives on ImageKit — use `Image`/`Video` from `@imagekit/next` with paths relative to the urlEndpoint; never add files to `public/` or `src/assets/`.
- Adopting a shadcn template block: rename file + exported component to its purpose, drop `"use client"` unless interactive, swap placeholders for props and hardcoded styles for global tokens, and co-locate under the route (`_components/`) if route-specific — otherwise `src/components/`.
