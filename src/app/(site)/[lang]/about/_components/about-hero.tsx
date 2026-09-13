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
        className="pointer-events-none absolute inset-0 bg-[url(https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/grid-1.svg)] mask-[radial-gradient(ellipse_92%_78%_at_50%_28%,#000_32%,transparent_76%)] bg-size-[100%_1198px] bg-top bg-no-repeat"
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
