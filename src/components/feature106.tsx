import { Blocks, ChartPie, ChevronRight, Layout, Target } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const features = [
  {
    id: 1,
    header: "Task Coordination",
    excerpt:
      "Easily manage and organize tasks to improve your workflow efficiency.",
    icon: <Target className="h-auto w-5" />,
    title: "Master Task Coordination",
    description:
      "Learn to easily manage and organize tasks to improve workflow efficiency. Explore how this simplifies task coordination for better results.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
  },
  {
    id: 2,
    header: "Team Collaboration",
    excerpt:
      "Boost teamwork with intuitive communication and collaboration tools.",
    icon: <Layout className="h-auto w-5" />,
    title: "Effective Team Collaboration",
    description:
      "Improve team collaboration and communication with intuitive tools. Learn how to streamline teamwork and achieve project success with ease.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg",
  },
  {
    id: 3,
    header: "Resource Management",
    excerpt:
      "Maximize resource use for greater efficiency and project success.",
    icon: <Blocks className="h-auto w-5" />,
    title: "Efficient Resource Management",
    description:
      "Maximize resource management and efficiency. Discover how to effectively utilize resources for greater productivity and project outcomes.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-3.svg",
  },
  {
    id: 4,
    header: "System Integration",
    excerpt:
      "Integrate your tools seamlessly for a smoother, more efficient workflow.",
    icon: <ChartPie className="h-auto w-5" />,
    title: "Streamlined System Integration",
    description:
      "Integrate systems and tools seamlessly for smoother workflows. Learn how to improve interoperability for more efficient processes.",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-4.svg",
  },
];

interface Feature106Props {
  className?: string;
}

const Feature106 = ({ className }: Feature106Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <Accordion
          type="single"
          collapsible
          defaultValue="1"
          className="overflow-hidden rounded-xl border lg:hidden"
        >
          {features.map((feature, index) => (
            <AccordionItem
              key={feature.id}
              value={feature.id.toString()}
              className={cn(
                "border-0 bg-muted/50 px-6 py-4 data-[state=open]:bg-background",
                index !== features.length - 1 && "border-b",
              )}
            >
              <AccordionTrigger className="items-start text-left hover:no-underline">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    {feature.icon}
                    <span className="text-base font-semibold">
                      {feature.header}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.excerpt}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="!h-auto pt-4 [&>div]:!h-auto">
                <div className="flex flex-col gap-5 rounded-xl border bg-muted/50 p-5">
                  <div>
                    <h2 className="mb-2 font-medium">{feature.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  <img
                    src={feature.image}
                    alt="placeholder"
                    className="aspect-video max-h-[450px] rounded-xl border object-cover"
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
            {features.map((feature, index) => (
              <TabsTrigger
                key={feature.id}
                value={feature.id.toString()}
                className={cn(
                  "group relative !h-auto !w-full !flex-col !items-start !justify-start gap-2.5 !rounded-none !border-0 !bg-muted/50 !px-6 !py-6 !whitespace-normal !text-foreground !shadow-none !ring-0 transition-colors duration-300 after:!hidden after:!bg-transparent after:!opacity-0 data-[state=active]:!border-0 data-[state=active]:!bg-background data-[state=active]:!shadow-none data-[state=active]:!ring-0 data-[state=active]:after:!hidden data-[state=active]:after:!bg-transparent data-[state=active]:after:!opacity-0",
                  index !== features.length - 1 &&
                    "!border-b-[1px] !border-b-border data-[state=active]:!border-b-[1px] data-[state=active]:!border-b-border",
                )}
              >
                <span className="absolute top-0 bottom-0 left-0 h-full w-[3px] bg-primary transition-opacity duration-300 group-data-[state=inactive]:opacity-0"></span>
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {feature.icon}
                    <span className="text-base font-semibold">
                      {feature.header}
                    </span>
                  </div>
                  <ChevronRight className="h-auto w-4 shrink-0" />
                </div>
                <p className="w-full text-left text-sm text-muted-foreground">
                  {feature.excerpt}
                </p>
              </TabsTrigger>
            ))}
          </TabsList>
          {features.map((feature) => (
            <TabsContent
              value={feature.id.toString()}
              key={feature.id}
              className="col-span-2 flex flex-col gap-7 bg-background p-10 data-[state=inactive]:hidden"
            >
              <div>
                <h2 className="mb-2 text-2xl font-medium">{feature.title}</h2>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
              <img
                src={feature.image}
                alt="placeholder"
                className="aspect-video max-h-[450px] rounded-xl object-cover"
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export { Feature106 };
