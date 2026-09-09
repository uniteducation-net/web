# Content

File-based content for the site. Four types: `updates/` (blog), `team/`,
`legal/`, `events/`.

## Layout

One folder per item, translations side by side, assets co-located:

```
updates/my-post/
  en.mdx          # required (fallback locale)
  de.mdx          # optional — missing locales fall back to en
  cover.jpg       # frontmatter-referenced ("cover: cover.jpg")
  diagram.svg     # imported inside the .mdx: import Diagram from "./diagram.svg"
```

Rules:

- **Slug = folder name, identical across locales** — the language switcher
  swaps only the locale segment, so `/en/updates/my-post` ↔
  `/de/updates/my-post` must both resolve.
- Missing `<locale>.mdx` falls back to English. A missing `en.mdx` removes
  the item entirely.
- SVGs always import as React components (SVGR), never `<img src>`: use
  `import D from "./d.svg"` + `<D />`, or `import G from "@/assets/g.svg"`
  for global ones (see `src/assets/README.md`).
- Raster images (jpg/png/webp) use normal markdown `![alt](./cover.jpg)` or
  the frontmatter fields below.

## Frontmatter

Parsed by `remark-frontmatter` + `remark-mdx-frontmatter`; typed in
`src/lib/content.ts`.

- **updates**: `title`, `description`, `date` (ISO), `author?` (team slug),
  `tags?`, `cover?`, `draft?` (excluded from lists)
- **team**: `name`, `role`, `tags?`, `links?` (`linkedin`/`github`/`website`),
  `image?`, `hoverImage?`, `order?` — body is the bio
- **legal**: `title`, `description`, `lastUpdated`
- **events**: `title`, `description`, `startDate` (ISO, `T` time optional),
  `endDate?`, `location?`, `tags?`, `registrationUrl?`, `cover?` —
  upcoming/past is derived from the dates

## Rendering

Routes in `src/app/[lang]/<type>/…` load through `src/lib/content.ts`
(`getContent` / `getAllContent` / `getAsset`) and prerender fully statically
at build time (`generateStaticParams` + `dynamicParams = false`).
