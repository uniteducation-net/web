import { ImageKitClientProvider } from "@/components/imagekit-provider";
import { NotFoundView } from "@/components/not-found-view";

/**
 * Workspace 404 — renders inside the workspace root layout, which has no
 * ImageKit provider, so the view is wrapped here. The workspace is
 * English-only, so the locale is pinned.
 */
export default function WorkspaceNotFound() {
  return (
    <ImageKitClientProvider>
      <NotFoundView homeHref="/" lang="en" />
    </ImageKitClientProvider>
  );
}
