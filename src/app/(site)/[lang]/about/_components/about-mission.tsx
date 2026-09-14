"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { Target } from "lucide-react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { IllustrationImage } from "@/components/illustration-image";
import { cn } from "@/lib/utils";
const DATA = [
  {
    title: "Our Mission",
    description:
      "We build a free online platform for emerging educators who teach in classrooms without a formal teaching background or training.",
    image: {
      src: "/illustrations/online-learning.svg",
      alt: "Our Mission",
    },
  },
  {
    title: "More Than Subject Matter",
    description:
      "To deliver quality classes for students, teachers need to be trained in more than just the subject matter. Our platform helps them develop the essential skills to teach well, no matter the age group, school form, or subject.",
    image: {
      src: "/illustrations/ideas-flow.svg",
      alt: "More Than Subject Matter",
    },
    reverse: true,
  },
  {
    title: "7 Content Areas",
    description:
      "Teaching & Learning Fundamentals, Teacher Presence & Communication, Classroom Management, Inclusive Training, Context-Responsive Teaching, Ethics & Safeguarding, and Teacher Growth & Wellbeing.",
    image: {
      src: "/illustrations/five-year-plan.svg",
      alt: "7 Content Areas",
    },
  },
  {
    title: "Your Personal Path",
    description:
      "On the platform, AI helps you analyze which skills are most relevant for your use case and build your own personalized learning path — to follow at your own speed and liking.",
    image: {
      src: "/illustrations/set-preferences.svg",
      alt: "Your Personal Path",
    },
    reverse: true,
  },
];

const AboutMission = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="mission" className="py-32">
      <div className="border-y">
        <div className="container flex flex-col gap-6 border-x py-4 max-lg:border-x lg:py-8">
          <Badge
            variant="outline"
            className="w-fit gap-1 bg-card px-3 text-sm font-normal tracking-tight shadow-sm"
          >
            <Target className="size-4" />
            <span>Our Mission</span>
          </Badge>
          <h2 className="font-heading text-title font-semibold">
            Free training for emerging educators
          </h2>
          <p className="max-w-[600px] tracking-[-0.32px] text-muted-foreground">
            Quality classes need more than subject knowledge — here&rsquo;s how our
            platform builds the skills to teach, step by step
          </p>
        </div>
      </div>

      <div
        ref={ref}
        className="relative container border-x pb-40 lg:pt-20 [&>*:last-child]:pb-20 [&>div>div:first-child]:pt-20!"
      >
        <div className="pointer-events-none absolute top-0 z-0 h-full w-[3px] translate-x-5 lg:left-1/2 lg:-translate-x-1/2">
          <div className="h-4 w-[3px] bg-linear-to-b from-transparent to-foreground/10"></div>
          <div className="relative h-[calc(100%-1rem)] w-full bg-linear-to-b from-foreground/10 via-foreground/10 to-transparent">
            <motion.div
              className="absolute top-0 left-0 z-10 w-[3px] rounded-full bg-linear-to-b from-transparent via-primary to-transparent"
              style={{ height }}
            />
          </div>
        </div>
        {DATA.map((item, index) => (
          <div key={index} className="relative flex">
            <div
              className={`flex w-full justify-center px-1 py-10 text-end md:gap-6 lg:gap-10 ${item?.reverse ? "lg:flex-row-reverse lg:text-start" : ""} `}
            >
              <div className="flex-1 max-lg:hidden">
                <h3 className="text-2xl tracking-[-0.96px]">{item.title}</h3>
                <p
                  className={`mt-2.5 max-w-[300px] tracking-[-0.32px] text-balance text-muted-foreground ${item?.reverse ? "" : "ml-auto"}`}
                >
                  {item.description}
                </p>
              </div>
              <div className="flex-1 max-lg:ml-10">
                <div className="text-start lg:pointer-events-none lg:hidden">
                  <h3 className="text-2xl tracking-[-0.96px]">{item.title}</h3>
                  <p className="mt-2.5 mb-10 max-w-[300px] tracking-[-0.32px] text-balance text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-start justify-start">
                  <div className={` ${item?.reverse ? "lg:ml-auto" : ""}`}>
                    <div className="px-6 lg:px-10">
                      <DiagonalPattern className="h-6 lg:h-10" />
                    </div>
                    <div className="relative grid grid-cols-[auto_1fr_auto] items-stretch">
                      <DiagonalPattern className="h-full w-6 lg:w-10" />
                      <IllustrationImage
                        src={item.image.src}
                        alt={item.image.alt}
                        className="aspect-[4/5] w-full max-w-[400px]"
                        imageClassName="dark:invert"
                      />
                      <DiagonalPattern className="w-6 lg:w-10" />
                    </div>
                    <div className="px-6 lg:px-10">
                      <DiagonalPattern className="h-6 lg:h-10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-8 w-full border-y md:h-12 lg:h-[112px]">
        <div className="container h-full w-full border-x"></div>
      </div>
    </section>
  );
};

export { AboutMission };

const DiagonalPattern = ({
  className,
  // Hex without '#': the SVG data URI is an isolated document, so CSS vars
  // (e.g. var(--foreground)) can't reach its fill — use a neutral gray that
  // reads as muted foreground at low opacity in both light and dark themes.
  patternColor = "737373",
  patternOpacity = 0.15,
}: {
  className?: string;
  patternColor?: string;
  patternOpacity?: number;
}) => {
  const svgPattern = `url("data:image/svg+xml,%3Csvg width='7' height='7' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${patternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div
      className={cn("h-full w-full border-2 border-dashed", className)}
      style={{
        backgroundImage: svgPattern,
      }}
    />
  );
};
