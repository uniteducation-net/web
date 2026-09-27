import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { IllustrationImage } from "@/components/illustration-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroButton {
  text: string;
  url: string;
}

interface DonateHeroProps {
  heading: string;
  description: string[];
  primary: HeroButton;
  secondary?: HeroButton;
  image: { src: string; alt: string };
  className?: string;
}

/** Internal routes use next/link; external/mailto/anchor URLs a plain anchor
    (new tab only for http(s), matching the footer convention). Spreads the
    anchor props Slot injects when wrapped in `Button asChild`. */
const HeroCta = ({
  button,
  children,
  ...props
}: { button: HeroButton; children: ReactNode } & Omit<
  ComponentProps<"a">,
  "href"
>) => {
  if (button.url.startsWith("/")) {
    return (
      <Link href={button.url} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={button.url}
      {...(button.url.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      {...props}
    >
      {children}
    </a>
  );
};

const DonateHero = ({
  heading,
  description,
  primary,
  secondary,
  image,
  className,
}: DonateHeroProps) => {
  return (
    <section className={cn("container py-12 md:py-20", className)}>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="font-heading text-display font-semibold text-balance">
            {heading}
          </h1>
          <div className="mt-6 max-w-xl space-y-4 text-lead text-muted-foreground">
            {description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <HeroCta button={primary}>
                {primary.text}
                <ArrowRight className="size-4" />
              </HeroCta>
            </Button>
            {secondary && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <HeroCta button={secondary}>{secondary.text}</HeroCta>
              </Button>
            )}
          </div>
        </div>
        <IllustrationImage
          src={image.src}
          alt={image.alt}
          priority
          className="mx-auto aspect-square w-full max-w-[520px]"
        />
      </div>
    </section>
  );
};

export { DonateHero };
