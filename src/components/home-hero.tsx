"use client";
import { Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n-config";
import { cn } from "@/lib/utils";

interface HomeHeroDict {
  heading: string;
  subtitle: string;
  forTeachers: string;
  getInvolved: string;
  playLabel: string;
  videoTitle: string;
}

interface HomeHeroProps {
  className?: string;
  /** Localized hero copy, from the dictionary. */
  dict: HomeHeroDict;
  lang: Locale;
}

const VIDEO_IDS: Record<Locale, string> = {
  en: "7BU9iHbUm8M",
  de: "_6TsJERNjjk",
};

const HomeHero = ({ className, dict, lang }: HomeHeroProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = VIDEO_IDS[lang] ?? VIDEO_IDS.en;

  return (
    <section
      className={cn("relative bg-background pb-32", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url(https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/grid-1.svg)] mask-[radial-gradient(ellipse_92%_78%_at_50%_28%,#000_32%,transparent_76%)] bg-size-[100%_100%] bg-center bg-no-repeat"
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
              <Link href="/workspace">{dict.forTeachers}</Link>
            </Button>
            <Button
              asChild
              variant="link"
              className="text-lg underline"
            >
              <Link href="/get-involved">{dict.getInvolved}</Link>
            </Button>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[72rem]">
          <div className="mt-14 flex w-full flex-col items-center rounded-2xl border border-border bg-muted p-3">
            <div className="relative w-full overflow-hidden rounded-t-sm border border-border bg-background">
              <AspectRatio
                ratio={16 / 9}
                className="overflow-hidden rounded-t-sm"
              >
                <div className="relative size-full">
                  {isPlaying ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                      title={dict.videoTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="size-full rounded-t-sm"
                    />
                  ) : (
                    <>
                      {/* Facade: only the cover shows until the user clicks play */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="size-full rounded-t-sm object-cover object-center"
                      />
                      <Button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        size="icon"
                        aria-label={dict.playLabel}
                        className="absolute top-1/2 left-1/2 z-30 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary text-secondary-foreground shadow-[0_0_0_14px_var(--color-border)] transition-all hover:bg-secondary/90 hover:shadow-[0_0_0_0px_var(--color-border)] md:h-14 md:w-14 lg:h-20 lg:w-20"
                      >
                        <div className="m-auto aspect-square w-[45%]">
                          <Play className="h-full! w-full! fill-current stroke-current" />
                        </div>
                      </Button>
                    </>
                  )}
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { HomeHero };
