"use client";

import Link from "next/link";

import { IllustrationImage } from "@/components/illustration-image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export interface HighlightItem {
  slug: string;
  title: string;
  description: string;
  /** ImageKit path relative to the urlEndpoint. */
  image?: string;
  href: string;
}

interface HighlightsProps {
  heading: string;
  items: HighlightItem[];
  className?: string;
}

/** "Highlights" carousel on the updates overview — posts flagged with
 *  `highlight: true` in their frontmatter. */
const Highlights = ({ heading, items, className }: HighlightsProps) => {
  if (!items.length) return null;
  return (
    <section className={cn("pt-32 pb-16", className)}>
      <div className="container">
        <h2 className="mb-12 text-4xl font-medium tracking-tight md:mb-16 md:text-5xl">
          {heading}
        </h2>
        <Carousel className="relative w-full">
          <CarouselContent className="ease-in">
            {items.map((item) => (
              <CarouselItem key={item.slug}>
                <Link
                  href={item.href}
                  className="group flex flex-col items-center justify-between gap-4 rounded-2xl bg-muted py-20 pl-8 md:flex-row md:pl-16"
                >
                  <div className="w-full pr-2 md:max-w-xs md:pr-0">
                    <h3 className="mb-6 text-xl font-medium sm:text-2xl md:text-5xl">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground md:text-base">
                      {item.description}
                    </p>
                  </div>
                  {item.image && (
                    <IllustrationImage
                      src={item.image}
                      alt={item.title}
                      className="h-80 max-h-[560px] w-full max-w-2xl rounded-l-2xl md:h-full"
                      imageClassName="object-contain transition duration-300 group-hover:scale-105"
                    />
                  )}
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="absolute bottom-16 left-16 md:bottom-11">
            <CarouselPrevious className="size-14" />
          </div>
          <div className="absolute right-16 bottom-16 md:bottom-11">
            <CarouselNext className="size-14" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export { Highlights };
