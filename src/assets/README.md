# Global SVG assets

SVGs used across pages/components (icons, illustrations, brand marks) live
here and are imported as React components via the SVGR rule in
`next.config.ts`:

```tsx
import Sparkle from "@/assets/sparkle.svg";

<Sparkle className="size-6 text-primary" aria-label="..." />
```

Rules of thumb:

- **Global** (reused in more than one place) → here.
- **Used by a single content item** (post diagram, team photo, event cover)
  → co-locate it in that item's folder under `src/content/<type>/<slug>/`.
- Brand logo variants stay inline in `src/components/logo.tsx`.
