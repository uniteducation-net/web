"use client";

import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { IllustrationImage } from "@/components/illustration-image";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/i18n-config";
import { cn } from "@/lib/utils";

/** One slide of the milestones slider — shape mirrors MilestoneFrontmatter
 *  in src/lib/content.ts (plus the content slug as `id`). */
export interface MilestoneItem {
  id: string;
  /** Free-text slider tab label — a year ("2024"), "Today", anything. */
  tag: string;
  tagline: string;
  title: string;
  description: string;
  buttonText: string;
  /** Internal path — rendered with the locale prefix. */
  href: string;
  /** ImageKit path relative to the urlEndpoint. */
  image: string;
}

interface AboutMilestonesProps {
  lang: Locale;
  title: string;
  milestones: MilestoneItem[];
  className?: string;
}

const AboutMilestones = ({
  lang,
  title,
  milestones,
  className,
}: AboutMilestonesProps) => {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [activeTab, setActiveTab] = useState(milestones[0]?.id ?? "");

  const setTab = useCallback(
    (isNext: boolean) => {
      const currentActiveTabIndex = milestones.findIndex(
        ({ id }) => id === activeTab,
      );
      if (currentActiveTabIndex === -1) return;

      const nextActiveTabIndex = isNext
        ? (currentActiveTabIndex + 1) % milestones.length
        : (currentActiveTabIndex - 1 + milestones.length) % milestones.length;
      const nextActiveTab = milestones[nextActiveTabIndex]?.id;
      setActiveTab(nextActiveTab || milestones[0].id);
    },
    [milestones, activeTab],
  );

  const onNextClick = () => {
    if (!api) return;
    setTab(true);
    api.scrollNext();
  };

  const onPreviousClick = () => {
    if (!api) return;
    setTab(false);
    api.scrollPrev();
  };

  useEffect(() => {
    if (!api) return;

    const autoplayOnSelectHandler = () => setTab(true);
    api.on("autoplay:select", autoplayOnSelectHandler);

    return () => {
      api.off("autoplay:select", autoplayOnSelectHandler);
    };
  }, [api, milestones, activeTab, setTab]);

  if (milestones.length === 0) {
    return null;
  }

  return (
    <section id="milestones" className={cn("py-32", className)}>
      <div className="container space-y-7">
        <h2 className="text-center font-heading text-title font-semibold">
          {title}
        </h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {milestones.map(
            ({ id, title, description, image, tagline, buttonText, href }) => (
              <TabsContent key={id} value={id} className="group">
                <div className="flex w-full flex-col-reverse gap-y-10 lg:flex-row">
                  <div className="lg:flex-1">
                    <div
                      className={cn(
                        "flex h-full animate-in flex-col justify-center gap-4 lg:px-20",
                        "duration-900 fade-in group-data-[state=active]:slide-in-from-bottom-10",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm uppercase">
                        <Circle className="size-1 fill-foreground stroke-foreground" />
                        {tagline}
                      </span>
                      <h3 className="text-3xl font-medium lg:text-4xl">
                        {title}
                      </h3>
                      <p className="mt-4 leading-relaxed font-light md:text-base">
                        {description}
                      </p>
                      <Button
                        asChild
                        variant="link"
                        className="h-auto w-fit px-0"
                      >
                        <Link href={`/${lang}${href}`}>
                          {buttonText}
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="lg:flex-1">
                    <IllustrationImage
                      src={image}
                      alt={title}
                      className="aspect-[1.33] w-full rounded-xl border shadow-md"
                      imageClassName={cn(
                        "object-cover object-center",
                        "animate-in duration-900 fade-in",
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
            ),
          )}
          <div className="flex flex-col gap-x-4 lg:flex-row">
            <div className="flex-1">
              <TabsList className="block h-fit! w-full py-5" variant="line">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                    watchDrag: false,
                  }}
                  setApi={setApi}
                  className="[&>div]:py-2"
                  plugins={[
                    Autoplay({
                      delay: 8000,
                      stopOnMouseEnter: true,
                      stopOnInteraction: false,
                    }),
                  ]}
                >
                  <CarouselContent className="m-0 py-1">
                    {milestones.map(({ id, tag }) => (
                      <CarouselItem
                        key={id}
                        className="basis-1/2 p-0 sm:basis-1/3 lg:basis-1/4"
                      >
                        <div
                          className={cn(
                            "relative flex flex-col items-center gap-8",
                            "after:absolute after:top-0 after:left-1/2 after:h-12 after:w-px after:-translate-x-1/2 after:bg-foreground after:opacity-20",
                          )}
                        >
                          <TabsTrigger
                            value={id}
                            className={cn(
                              "group peer w-full py-0",
                              "after:opacity-20 group-data-horizontal/tabs:after:bottom-auto group-data-horizontal/tabs:after:h-px group-data-[variant=line]/tabs-list:data-active:after:opacity-20",
                            )}
                          >
                            <div
                              className={cn(
                                "relative z-10 size-4 rounded-full transition-all",
                                "bg-muted-foreground group-data-[state=active]:bg-primary",
                                "after:pointer-events-none after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity group-data-[state=active]:after:opacity-100 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
                              )}
                            ></div>
                          </TabsTrigger>
                          <div className="relative z-10 px-1.5 py-2 text-center text-sm font-light text-muted-foreground transition-all peer-data-[state=active]:font-semibold peer-data-[state=active]:text-foreground">
                            {tag}
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </TabsList>
            </div>
            <div className="flex-none max-lg:self-center">
              <div className="flex gap-4 lg:mt-5">
                <Button
                  size="icon-lg"
                  variant="outline"
                  className="rounded-slider-button"
                  onClick={onPreviousClick}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon-lg"
                  variant="outline"
                  className="rounded-slider-button"
                  onClick={onNextClick}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </section>
  );
};

export { AboutMilestones };
