import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AboutHeroDict {
  heading: string;
  subtitle: string;
  seeTheProject: string;
}

interface AboutHeroProps {
  className?: string;
  /** Localized hero copy, from the dictionary. */
  dict: AboutHeroDict;
}

const AboutHero = ({ className, dict }: AboutHeroProps) => {
  return (
    <section id="project" className={cn("relative bg-background pb-32", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQzOCIgaGVpZ2h0PSIxMTk4IiB2aWV3Qm94PSIwIDAgMTQzOCAxMTk4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8bGluZSB4MT0iMTQzOCIgeTE9IjEwNzguNSIgeTI9IjEwNzguNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxNDM4IiB5MT0iOTU4LjUiIHkyPSI5NTguNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxNDM4IiB5MT0iODM4LjUiIHkyPSI4MzguNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxNDM4IiB5MT0iNzE5LjUiIHkyPSI3MTkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxNDM4IiB5MT0iNTk5LjUiIHkyPSI1OTkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxNDM4IiB5MT0iNDc5LjUiIHkyPSI0NzkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxNDM4IiB5MT0iMzU5LjUiIHkyPSIzNTkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxNDM4IiB5MT0iMjM5LjUiIHkyPSIyMzkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxNDM4IiB5MT0iMTE5LjUiIHkyPSIxMTkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxMTkuNSIgeTE9IjExOTgiIHgyPSIxMTkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIyMzkuNSIgeTE9IjExOTgiIHgyPSIyMzkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIzNTkuNSIgeTE9IjExOTgiIHgyPSIzNTkuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSI0NzguNSIgeTE9IjExOTgiIHgyPSI0NzguNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSI1OTguNSIgeTE9IjExOTgiIHgyPSI1OTguNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSI3MTguNSIgeTE9IjExOTgiIHgyPSI3MTguNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSI4MzguNSIgeTE9IjExOTgiIHgyPSI4MzguNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSI5NTguNSIgeTE9IjExOTgiIHgyPSI5NTguNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxMDc4LjUiIHkxPSIxMTk4IiB4Mj0iMTA3OC41IiBzdHJva2U9IiNFRkVGRUYiLz4KPGxpbmUgeDE9IjExOTcuNSIgeTE9IjExOTgiIHgyPSIxMTk3LjUiIHN0cm9rZT0iI0VGRUZFRiIvPgo8bGluZSB4MT0iMTMxNy41IiB5MT0iMTE5OCIgeDI9IjEzMTcuNSIgc3Ryb2tlPSIjRUZFRkVGIi8+CjxsaW5lIHgxPSIxMTk3LjUiIHkxPSIzNTAuNSIgeDI9IjExOTcuNSIgeTI9IjM2OC41IiBzdHJva2U9IiM0MDQwNDAiIHN0cm9rZS13aWR0aD0iMC42MjA2OSIvPgo8bGluZSB4MT0iMTE4OC41IiB5MT0iMzU5LjUiIHgyPSIxMjA2LjUiIHkyPSIzNTkuNSIgc3Ryb2tlPSIjNDA0MDQwIiBzdHJva2Utd2lkdGg9IjAuNjIwNjkiLz4KPGxpbmUgeDE9IjIzOS41IiB5MT0iMjMwLjUiIHgyPSIyMzkuNSIgeTI9IjI0OC41IiBzdHJva2U9IiM0MDQwNDAiIHN0cm9rZS13aWR0aD0iMC42MjA2OSIvPgo8bGluZSB4MT0iMjMwLjUiIHkxPSIyMzkuNSIgeDI9IjI0OC41IiB5Mj0iMjM5LjUiIHN0cm9rZT0iIzQwNDA0MCIgc3Ryb2tlLXdpZHRoPSIwLjYyMDY5Ii8+Cjwvc3ZnPgo=)] mask-[radial-gradient(ellipse_92%_78%_at_50%_28%,#000_32%,transparent_76%)] bg-size-[100%_1198px] bg-top bg-no-repeat"
      />
      <div className="relative z-10 container pt-12 md:pt-24">
        <div className="flex flex-col items-center gap-5">
          <h1 className="max-w-[25rem] bg-linear-to-r from-foreground via-foreground/70 to-foreground/80 bg-clip-text py-2 text-center font-heading text-display font-semibold text-transparent md:max-w-[43.75rem] lg:max-w-[56.25rem]">
            {dict.heading}
          </h1>
          <p className="max-w-[22.5rem] text-center text-lead text-muted-foreground md:max-w-[35rem]">
            {dict.subtitle}
          </p>
          <div className="flex items-center gap-8 pt-6">
            <Button
              asChild
              className="block h-fit w-fit animate-shadow-ping rounded-md px-6 py-3.5 text-center text-lg"
            >
              <Link href="/workspace">{dict.seeTheProject}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { AboutHero };
