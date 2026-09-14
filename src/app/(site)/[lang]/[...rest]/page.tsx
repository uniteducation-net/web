import { notFound } from "next/navigation";

/**
 * Catch-all so unmatched localized URLs (`/en/some-typo`) render the
 * in-layout `not-found.tsx` above instead of the layout-less global 404.
 */
export default function CatchAllPage() {
  notFound();
}
