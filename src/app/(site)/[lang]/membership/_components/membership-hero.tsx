import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Pricing {
  label: string;
  price: string;
  unit: string;
  description: string;
}

interface MembershipHeroProps {
  badge?: string;
  heading?: string;
  description?: string;
  buttons?: {
    primary?: { text: string; url: string };
    secondary?: { text: string; url: string };
  };
  image?: { src: string; alt: string };
  pricing?: Pricing;
  className?: string;
}

const MembershipHero = ({
  badge = "New Release",
  heading = "Welcome to Our Website",
  description = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Elig doloremque mollitia fugiat omnis! Porro facilis quo animi consequatur. Explicabo.",
  buttons = {
    primary: {
      text: "Primary",
      url: "#",
    },
    secondary: {
      text: "Secondary",
      url: "#",
    },
  },
  pricing = {
    label: "Now starting at",
    price: "$99",
    unit: "/user",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
  },
  image = {
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
    alt: "placeholder hero",
  },
  className,
}: MembershipHeroProps) => {
  return (
    <section className={cn("", className)}>
      <div className="lg:container">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="container flex flex-col items-center py-12 text-center lg:mx-auto lg:items-start lg:px-0 lg:text-left">
            {badge && <p>{badge}</p>}
            <h1 className="my-6 text-4xl font-bold text-pretty lg:text-6xl">
              {heading}
            </h1>
            <p className="mb-8 max-w-xl text-muted-foreground lg:text-xl">
              {description}
            </p>
            <div className="mb-24 flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
              {buttons?.primary && (
                <Button asChild className="w-full sm:w-auto">
                  <a href={buttons.primary.url}>
                    {buttons.primary.text}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              )}
              {buttons?.secondary && (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href={buttons.secondary.url}>{buttons.secondary.text}</a>
                </Button>
              )}
            </div>
            {pricing && (
              <div className="rounded border border-border px-8 py-6">
                <p className="mb-2 text-xl font-medium">{pricing.label}</p>
                <div className="mb-4 flex items-baseline justify-center lg:justify-start">
                  <div className="text-4xl font-bold lg:text-6xl">
                    {pricing.price}
                  </div>
                  <div className="text-xl leading-none font-bold lg:text-2xl lg:leading-none">
                    {pricing.unit}
                  </div>
                </div>
                <p className="text-sm">{pricing.description}</p>
              </div>
            )}
          </div>
          {/* Placeholder media: the default is a remote SVG, which next/image
              refuses without dangerouslyAllowSVG. Replace with ImageKit media
              (and @imagekit/next Image) when real content lands. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export { MembershipHero };
