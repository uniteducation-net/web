import { notFound } from "next/navigation";

/**
 * Catch-all so unmatched workspace URLs render the workspace `not-found.tsx`
 * instead of falling through to the framework default.
 */
export default function WorkspaceCatchAllPage() {
  notFound();
}
