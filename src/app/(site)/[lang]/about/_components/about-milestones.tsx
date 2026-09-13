"use client";

import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type OurStoryItemType = {
  id: string;
  year: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
};

interface OurStoryDataType {
  title?: string;
  content?: OurStoryItemType[];
}

interface AboutMilestonesProps extends OurStoryDataType {
  className?: string;
}

const OUR_STORY_DATA: OurStoryDataType = {
  title: "Discover Our Story",
  content: [
    {
      id: "our-beginning",
      year: "2014",
      tagline: "The Start",
      title: "Our Beginning",
      description:
        "We started our journey with a simple idea and a lot of determination, driven by a passion to create something meaningful. With limited resources but strong ambition, we focused on building quality experiences and establishing a foundation rooted in trust, creativity, and long-term vision.",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
    },
    {
      id: "first-milestone",
      year: "2015",
      tagline: "First Success",
      title: "First Milestone",
      description:
        "We reached our first major milestone by welcoming our first 100 customers, marking an important validation of our vision. This early success motivated us to keep improving, refining our offerings, and building stronger relationships with our growing community.",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg",
    },
    {
      id: "expansion",
      year: "2016",
      tagline: "Growth",
      title: "Expansion",
      description:
        "As demand continued to grow, we expanded our team and opened a new office in another city to better serve our customers. This step allowed us to collaborate more effectively, scale our operations, and bring fresh perspectives into our evolving brand.",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-3.svg",
    },
    {
      id: "innovation",
      year: "2017",
      tagline: "Innovation",
      title: "Innovation",
      description:
        "We launched an innovative product that redefined our category and introduced new possibilities for our customers. By focusing on design, usability, and performance, we were able to deliver something that stood out and helped shape the direction of our industry.",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-4.svg",
    },
    {
      id: "global-reach",
      year: "2018",
      tagline: "Global Expansion",
      title: "Global Reach",
      description:
        "We expanded our services globally, reaching customers in over 50 countries and building a truly international presence. This milestone opened new opportunities, allowed us to understand diverse markets, and strengthened our commitment to delivering consistent quality worldwide.",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-5.svg",
    },
    {
      id: "sustainability",
      year: "2019",
      tagline: "Sustainability",
      title: "Sustainability",
      description:
        "We made a strong commitment to sustainability by integrating eco-friendly practices into our operations and product design. From responsible sourcing to reducing waste, we focused on minimizing our environmental impact while continuing to deliver high-quality experiences to our customers.",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-6.svg",
    },
    {
      id: "community-impact",
      year: "2020",
      tagline: "Community Impact",
      title: "Community Impact",
      description:
        "We launched initiatives focused on giving back to our community and supporting meaningful local causes. Through partnerships, donations, and volunteer efforts, we aimed to create a positive impact beyond our business, reinforcing our values of responsibility, connection, and shared growth.",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
    },
  ],
};

const AboutMilestones = ({
  className,
  title = OUR_STORY_DATA.title,
  content = OUR_STORY_DATA.content,
}: AboutMilestonesProps) => {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [activeTab, setActiveTab] = useState(content ? content[0].id : "");

  const setTab = useCallback(
    (isNext: boolean) => {
      if (!content) return;
      const currentActiveTabIndex = content?.findIndex(
        ({ id }) => id === activeTab,
      );
      if (currentActiveTabIndex === undefined || currentActiveTabIndex === -1)
        return;

      const nextActiveTabIndex = isNext
        ? (currentActiveTabIndex + 1) % content.length
        : (currentActiveTabIndex - 1 + content.length) % content.length;
      const nextActiveTab = content[nextActiveTabIndex]?.id;
      setActiveTab(nextActiveTab || content[0].id);
    },
    [content, activeTab],
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
  }, [api, content, activeTab, setTab]);

  if (!content || content.length === 0) {
    return null;
  }

  return (
    <section id="milestones" className={cn("py-32", className)}>
      <div className="container space-y-7">
        <h2 className="text-center font-heading text-title font-semibold">
          {title}
        </h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {content.map(({ id, title, description, image, tagline }) => (
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
                  </div>
                </div>
                <div className="lg:flex-1">
                  <AspectRatio
                    ratio={1.33}
                    className="overflow-hidden rounded-xl border shadow-md"
                  >
                    <img
                      src={image}
                      alt={title}
                      className={cn(
                        "size-full object-cover object-center",
                        "animate-in duration-900 fade-in",
                      )}
                    />
                  </AspectRatio>
                </div>
              </div>
            </TabsContent>
          ))}
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
                    {content.map(({ id, year }) => (
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
                            {year}
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
                  className="rounded-full"
                  onClick={onPreviousClick}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon-lg"
                  variant="outline"
                  className="rounded-full"
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
