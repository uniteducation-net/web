import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Rocket,
} from "lucide-react";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    header: "We Learn from Teachers",
    excerpt:
      "We talk to teachers worldwide to understand what they need to do their jobs.",
    icon: <GraduationCap className="h-auto w-5" />,
    title: "We Learn from Teachers",
    description:
      "We personally talk to teachers from all over the world to hear their insights on what they need to do their jobs well.",
    image: "/assets/educator.svg",
    width: 851,
    height: 557,
    alt: "Illustration of an educator teaching",
  },
  {
    id: 2,
    header: "We Gather Resources & Research",
    excerpt:
      "Teachers' input, our research, and expert collaboration shape everything we build.",
    icon: <BookOpen className="h-auto w-5" />,
    title: "We Gather Resources & Research",
    description:
      "Based on input from teachers, our own research, and work with professionals, we build personalized courses and suggest tailored content and resources.",
    image: "/assets/team-collaboration.svg",
    width: 936,
    height: 505,
    alt: "Illustration of a team collaborating",
  },
  {
    id: 3,
    header: "We Put the Latest Technology to Work",
    excerpt:
      "We deliver knowledge, resources, and tools to teachers everywhere.",
    icon: <Rocket className="h-auto w-5" />,
    title: "We Put the Latest Technology to Work",
    description:
      "We deliver the knowledge, resources, tools, and technology teachers need around the globe using the latest technologies.",
    image: "/assets/deploy-globally.svg",
    width: 960,
    height: 645,
    alt: "Illustration of a global technology deployment",
  },
  {
    id: 4,
    header: "Accessible to All, Free Forever",
    excerpt: "Every teacher gets full access to these resources for free.",
    icon: <HeartHandshake className="h-auto w-5" />,
    title: "Accessible to All, Free Forever",
    description:
      "New and existing teachers get access to all of these resources for free — forever.",
    image: "/assets/showing-support.svg",
    width: 661,
    height: 514,
    alt: "Illustration of people supporting each other",
  },
];

interface HowItWorksProps {
  className?: string;
}

const HowItWorks = ({ className }: HowItWorksProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <h2 className="mb-10 text-center font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          How It Works
        </h2>
        <Accordion
          type="single"
          collapsible
          defaultValue="1"
          className="overflow-hidden rounded-xl border lg:hidden"
        >
          {steps.map((step, index) => (
            <AccordionItem
              key={step.id}
              value={step.id.toString()}
              className={cn(
                "border-0 bg-muted/50 px-6 py-4 data-[state=open]:bg-background",
                index !== steps.length - 1 && "border-b",
              )}
            >
              <AccordionTrigger className="items-start text-left hover:no-underline">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    {step.icon}
                    <span className="text-base font-semibold">
                      {step.header}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.excerpt}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="!h-auto pt-4 [&>div]:!h-auto">
                <div className="flex flex-col gap-5 rounded-xl border bg-muted/50 p-5">
                  <div>
                    <h3 className="mb-2 font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <Image
                    src={step.image}
                    width={step.width}
                    height={step.height}
                    alt={step.alt}
                    className="aspect-video max-h-[450px] rounded-xl border object-contain"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Tabs
          defaultValue="1"
          className="hidden grid-cols-3 overflow-hidden rounded-xl border lg:grid"
        >
          <TabsList
            variant="line"
            className="!h-auto !w-full flex-col !gap-0 !rounded-none !border-r !border-border !bg-muted/50 !p-0"
          >
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id.toString()}
                className={cn(
                  "group relative !h-auto !w-full !flex-col !items-start !justify-start gap-2.5 !rounded-none !border-0 !bg-muted/50 !px-6 !py-6 !whitespace-normal !text-foreground !shadow-none !ring-0 transition-colors duration-300 after:!hidden after:!bg-transparent after:!opacity-0 data-[state=active]:!border-0 data-[state=active]:!bg-background data-[state=active]:!shadow-none data-[state=active]:!ring-0 data-[state=active]:after:!hidden data-[state=active]:after:!bg-transparent data-[state=active]:after:!opacity-0",
                  index !== steps.length - 1 &&
                    "!border-b-[1px] !border-b-border data-[state=active]:!border-b-[1px] data-[state=active]:!border-b-border",
                )}
              >
                <span className="absolute top-0 bottom-0 left-0 h-full w-[3px] bg-primary transition-opacity duration-300 group-data-[state=inactive]:opacity-0"></span>
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {step.icon}
                    <span className="text-base font-semibold">
                      {step.header}
                    </span>
                  </div>
                  <ChevronRight className="h-auto w-4 shrink-0" />
                </div>
                <p className="w-full text-left text-sm text-muted-foreground">
                  {step.excerpt}
                </p>
              </TabsTrigger>
            ))}
          </TabsList>
          {steps.map((step) => (
            <TabsContent
              value={step.id.toString()}
              key={step.id}
              className="col-span-2 flex flex-col gap-7 bg-background p-10 data-[state=inactive]:hidden"
            >
              <div>
                <h3 className="mb-2 text-2xl font-medium">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              <Image
                src={step.image}
                width={step.width}
                height={step.height}
                alt={step.alt}
                className="aspect-video max-h-[450px] rounded-xl object-contain"
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export { HowItWorks };
