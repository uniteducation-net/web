import { Image } from "@imagekit/next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { ChatDemo } from "./chat-demo";
import { GraphDemo } from "./graph-demo";
import { ResourceCard } from "./resource-card";

// The /resources landing section, adopted from the feature37 shadcn block:
// same 5-col mosaic shell, but the image holders are now live demos and the
// cells are whole-card links. Card 3 uses @imagekit/next directly (not
// IllustrationImage) because the left-focused crop must come from an ImageKit
// transformation — IllustrationImage serves .svg unoptimized (orig-true),
// which would silently drop it. Requires an ImageKit provider ancestor (the
// resources root layout has none — page.tsx wraps one).
const ResourcesLanding = () => {
  return (
    <section className="py-16 md:py-32">
      <div className="container">
        <Button variant="ghost" size="sm" asChild className="mb-8 -ml-3">
          <Link href="/en">
            <ArrowLeft className="size-4" />
            Back to website
          </Link>
        </Button>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="font-heading text-title font-semibold">
            Resources for new teachers
          </h1>
          <p className="mt-4 text-lead text-muted-foreground">
            Get advice shaped to your classroom, browse the open knowledge
            graph, or start from a blank template.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <ResourceCard
            href="/workspace"
            title="Advice shaped around you"
            description="Three quick questions, and your AI advisor builds a plan around your classroom and background."
            className="md:col-span-5"
          >
            <ChatDemo />
          </ResourceCard>
          <ResourceCard
            href="/resources/all"
            title="Explore the resource graph"
            description="The entire brain of vetted resources our AI talks with — open to search, browse, and suggest additions."
            className="md:col-span-3"
          >
            <GraphDemo />
          </ResourceCard>
          <ResourceCard
            href="/workspace"
            title="Open a blank template"
            description="Start from a clean canvas and shape it into your first lesson."
            className="md:col-span-2"
          >
            <div className="relative aspect-video max-h-72 w-full overflow-hidden">
              <Image
                src="/illustrations/my-files.svg"
                alt=""
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                transformation={[
                  {
                    width: 800,
                    height: 450,
                    crop: "maintain_ratio",
                    focus: "left",
                  },
                ]}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
          </ResourceCard>
        </div>
      </div>
    </section>
  );
};

export { ResourcesLanding };
