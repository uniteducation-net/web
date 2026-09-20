import type { Metadata } from "next";

import { ImageKitClientProvider } from "@/components/imagekit-provider";

import { ResourcesLanding } from "./_components/resources-landing";

// No `title` here: the layout's title.template only applies to child
// segments, so this page inherits the layout default ("Resources — UnitEd").
export const metadata: Metadata = {
  description:
    "Personalized advice for new teachers, the open UnitEd resource graph, and a blank template to start from.",
};

// The resources root layout has no ImageKit provider (unlike the site tree),
// so the landing page wraps its own — same pattern as resources/not-found.tsx.
export default function ResourcesPage() {
  return (
    <ImageKitClientProvider>
      <ResourcesLanding />
    </ImageKitClientProvider>
  );
}
