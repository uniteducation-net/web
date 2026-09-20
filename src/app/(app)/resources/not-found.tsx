import { ImageKitClientProvider } from "@/components/imagekit-provider";
import { NotFoundView } from "@/components/not-found-view";

/**
 * Resources 404 — renders inside the resources root layout, which has no
 * ImageKit provider, so the view is wrapped here. The explorer is
 * English-only, so the locale is pinned.
 */
export default function ResourcesNotFound() {
  return (
    <ImageKitClientProvider>
      <NotFoundView homeHref="/resources/all" lang="en" />
    </ImageKitClientProvider>
  );
}
