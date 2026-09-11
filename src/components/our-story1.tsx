"use client";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OurStoryItemType = {
  id: string;
  date: string;
  title: string;
  description: string;
  image: string;
};

interface OurStory1Props {
  className?: string;
  content?: OurStoryItemType[];
}

const OUR_STORY_DATA: OurStoryItemType[] = [
  {
    id: "our-beginning",
    date: "01 Jan 2014",
    title: "Our Beginning",
    description:
      "We started our journey with a simple idea and a lot of determination, driven by a passion to create something meaningful. With limited resources but strong ambition, we focused on building quality experiences and establishing a foundation rooted in trust, creativity, and long-term vision.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
  },
  {
    id: "first-milestone",
    date: "15 Mar 2015",
    title: "First Milestone",
    description:
      "We reached our first major milestone by welcoming our first 100 customers, marking an important validation of our vision. This early success motivated us to keep improving, refining our offerings, and building stronger relationships with our growing community.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg",
  },
  {
    id: "expansion",
    date: "30 Jun 2016",
    title: "Expansion",
    description:
      "As demand continued to grow, we expanded our team and opened a new office in another city to better serve our customers. This step allowed us to collaborate more effectively, scale our operations, and bring fresh perspectives into our evolving brand.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-3.svg",
  },
  {
    id: "innovation",
    date: "10 Dec 2017",
    title: "Innovation",
    description:
      "We launched an innovative product that redefined our category and introduced new possibilities for our customers. By focusing on design, usability, and performance, we were able to deliver something that stood out and helped shape the direction of our industry.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-4.svg",
  },
  {
    id: "global-reach",
    date: "20 Aug 2018",
    title: "Global Reach",
    description:
      "We expanded our services globally, reaching customers in over 50 countries and building a truly international presence. This milestone opened new opportunities, allowed us to understand diverse markets, and strengthened our commitment to delivering consistent quality worldwide.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-5.svg",
  },
  {
    id: "sustainability",
    date: "05 May 2019",
    title: "Sustainability",
    description:
      "We made a strong commitment to sustainability by integrating eco-friendly practices into our operations and product design. From responsible sourcing to reducing waste, we focused on minimizing our environmental impact while continuing to deliver high-quality experiences to our customers.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-6.svg",
  },
  {
    id: "community-impact",
    date: "12 Nov 2020",
    title: "Community Impact",
    description:
      "We launched initiatives focused on giving back to our community and supporting meaningful local causes. Through partnerships, donations, and volunteer efforts, we aimed to create a positive impact beyond our business, reinforcing our values of responsibility, connection, and shared growth.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
  },
];

const OurStory1 = ({ className, content = OUR_STORY_DATA }: OurStory1Props) => {
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!api) return;
      api.scrollTo(index);
    },
    [api],
  );

  useEffect(() => {
    const onInit = (emblaApi: CarouselApi) => {
      if (!emblaApi) return;
      setScrollSnaps(emblaApi.scrollSnapList());
    };
    const onSelect = (emblaApi: CarouselApi) => {
      if (!emblaApi) return;
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    if (!api) return;

    onInit(api);
    onSelect(api);
    api.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
  }, [api]);

  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <Tabs defaultValue={content[0].id} className="w-full">
          {content.map(({ id, title, description, image }) => (
            <TabsContent key={id} value={id} className="group">
              <div className="flex w-full flex-col gap-7 md:flex-row md:gap-10">
                <div className="md:basis-176">
                  <AspectRatio
                    ratio={1.89}
                    className="overflow-hidden rounded-sm border shadow-md"
                  >
                    <img
                      src={image}
                      alt={title}
                      className={cn(
                        "size-full object-cover object-center",
                        "animate-in duration-900 fade-in zoom-in-130",
                      )}
                    />
                  </AspectRatio>
                </div>
                <div className="md:basis-full">
                  <div
                    className={cn(
                      "flex h-full animate-in flex-col justify-center gap-3 max-md:text-center",
                      "duration-900 fade-in group-data-[state=active]:slide-in-from-bottom-15",
                    )}
                  >
                    <h3 className="text-2xl font-medium md:text-4xl">
                      {title}
                    </h3>
                    <p className="leading-normal md:text-base">{description}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
          <TabsList className="block w-full py-5" variant="line">
            <Carousel
              opts={{
                align: "start",
              }}
              setApi={setApi}
            >
              <CarouselContent className="py-1">
                {content.map(({ id, date }) => (
                  <CarouselItem
                    key={id}
                    className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                  >
                    <TabsTrigger
                      value={id}
                      className={cn(
                        "w-full after:opacity-20 group-data-horizontal/tabs:after:bottom-auto group-data-horizontal/tabs:after:h-px",
                      )}
                    >
                      <span className="relative z-10 bg-background px-1.5">
                        {date}
                      </span>
                    </TabsTrigger>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </TabsList>
        </Tabs>
        <div className="flex items-center justify-center gap-2 py-7">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={cn(
                "size-2 rounded-full bg-primary/20 transition-opacity hover:opacity-100",
                selectedIndex === index && "bg-primary",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export { OurStory1 };
