"use client";

import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BarChart,
  BookOpen,
  Brain,
  Cloud,
  Code,
  CreditCard,
  Database,
  Factory,
  Fingerprint,
  Gamepad2,
  Globe,
  Home,
  Lock,
  Menu,
  MessageSquare,
  Plane,
  Settings,
  Shield,
  ShoppingCart,
  Sparkle,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface Solution {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const DATA_SOLUTIONS: Solution[] = [
  {
    title: "First solution",
    description: "Vestibulum scelerisque quis nisl ut convallis.",
    href: "#",
    icon: Cloud,
  },
  {
    title: "Another solution",
    description: "Curabitur vehicula malesuada enim a cursus.",
    href: "#",
    icon: Lock,
  },
  {
    title: "And a third solution",
    description: "Proin aliquam feugiat lobortis.",
    href: "#",
    icon: Fingerprint,
  },
  {
    title: "And a fourth solution",
    description: "Donec nec sapien nec dolor.",
    href: "#",
    icon: Cloud,
  },
];

interface Platfrom {
  title: string;
  href: string;
  icon: LucideIcon;
}

const DATA_PLATFORM_CASE: Platfrom[] = [
  {
    title: "Banking",
    href: "#",
    icon: CreditCard,
  },
  {
    title: "Fintech",
    href: "#",
    icon: Banknote,
  },
  {
    title: "E-commerce",
    href: "#",
    icon: ShoppingCart,
  },
  {
    title: "Travel & Hospitality",
    href: "#",
    icon: Plane,
  },
  {
    title: "Real Estate",
    href: "#",
    icon: Home,
  },
  {
    title: "Gaming",
    href: "#",
    icon: Gamepad2,
  },
  {
    title: "Manufacturing",
    href: "#",
    icon: Factory,
  },
  {
    title: "Logistics",
    href: "#",
    icon: Truck,
  },
];

interface Resource {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const DATA_RESOURCES: Resource[] = [
  {
    title: "AI Powered",
    description: "Explore AI-powered resources",
    href: "#",
    icon: Sparkle,
  },
  {
    title: "AI Development",
    description: "Tools and frameworks for AI development",
    href: "#",
    icon: Code,
  },
  {
    title: "Machine Learning",
    description: "Resources for machine learning enthusiasts",
    href: "#",
    icon: Brain,
  },
  {
    title: "Data Management",
    description: "Best practices for data management",
    href: "#",
    icon: Database,
  },
  {
    title: "Cloud AI",
    description: "Cloud-based AI solutions",
    href: "#",
    icon: Cloud,
  },
  {
    title: "AI Security",
    description: "Secure your AI applications",
    href: "#",
    icon: Shield,
  },
  {
    title: "AI Configuration",
    description: "Configure AI systems effectively",
    href: "#",
    icon: Settings,
  },
  {
    title: "AI Analytics",
    description: "Analyze AI performance metrics",
    href: "#",
    icon: BarChart,
  },
  {
    title: "Global AI Trends",
    description: "Stay updated with global AI trends",
    href: "#",
    icon: Globe,
  },
  {
    title: "AI Community",
    description: "Join the AI community",
    href: "#",
    icon: Users,
  },
  {
    title: "AI Learning",
    description: "Learn AI from the best resources",
    href: "#",
    icon: BookOpen,
  },
  {
    title: "AI Support",
    description: "Get support for AI-related queries",
    href: "#",
    icon: MessageSquare,
  },
];

interface HeaderProps {
  className?: string;
}

/** Same width + gutters as the header (`container` + `max-w-7xl`). */
const mobileNavInner = "container mx-auto max-w-7xl";

/** Accordion chevrons render after `children`, so padding must live on the trigger, not an inner wrapper. */
const mobileNavTriggerRow =
  "mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-8 py-4 hover:no-underline";

const Header = ({ className }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  return (
    <section className={cn("inset-x-0 top-0 z-20 bg-background", className)}>
      <div className="container mx-auto">
        <div className="flex w-full items-center justify-between gap-12 py-4">
          <a href="#" className="flex items-center gap-2">
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg"
              className="max-h-8"
              alt="Shadcn UI Navbar"
            />
            <span className="text-lg font-semibold tracking-tighter">
              Shadcnblocks.com
            </span>
          </a>
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
                <NavigationMenuContent className="min-w-[760px] p-4">
                  <div className="flex items-start justify-between">
                    <div className="max-w-[760px] flex-1">
                      <div className="text-xs tracking-widest text-muted-foreground">
                        Solutions
                      </div>
                      <div className="grid grid-rows-1 gap-6">
                        {DATA_SOLUTIONS.map((solution, index) => (
                          <NavigationMenuLink
                            key={index}
                            href={solution.href}
                            className="group flex flex-row items-center first:mt-4 hover:bg-transparent"
                          >
                            <div className="mr-4 rounded-lg bg-muted p-4 shadow-sm">
                              <solution.icon className="size-6 text-muted-foreground transition-all fade-in group-hover:text-foreground" />
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                              <div className="font-medium text-foreground">
                                {solution.title}
                              </div>
                              <div className="text-sm font-normal text-muted-foreground">
                                {solution.description}
                              </div>
                            </div>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                    <div className="max-w-[760px] flex-1">
                      <div className="text-xs tracking-widest text-muted-foreground">
                        By Use Case
                      </div>
                      <div className="mt-4 gap-6">
                        {DATA_PLATFORM_CASE.map((solution, index) => (
                          <NavigationMenuLink
                            key={index}
                            href={solution.href}
                            className="group flex flex-row items-center hover:bg-transparent"
                          >
                            <div className="mr-4 rounded-lg bg-muted p-2 shadow-sm">
                              <solution.icon className="size-4 text-muted-foreground transition-all fade-in group-hover:text-foreground" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-medium">
                                {solution.title}
                              </div>
                            </div>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent className="w-full min-w-[820px] p-4">
                  <div className="grid grid-cols-3 gap-6">
                    {DATA_RESOURCES.map((solution, index) => (
                      <NavigationMenuLink
                        key={index}
                        href={solution.href}
                        className="group flex flex-row items-center hover:bg-transparent"
                      >
                        <div className="mr-4 rounded-lg bg-muted p-4 shadow-sm">
                          <solution.icon className="size-6 text-muted-foreground transition-all fade-in group-hover:text-foreground" />
                        </div>
                        <div className="flex flex-col gap-1 text-sm font-normal text-muted-foreground">
                          <div className="font-medium text-foreground">
                            {solution.title}
                          </div>
                          <div className="font-normal text-muted-foreground">
                            {solution.description}
                          </div>
                        </div>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <Button variant="ghost">Developer</Button>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden items-center gap-4 lg:flex">
            <Button variant="ghost">Sign in</Button>
            <Button>Get Started</Button>
          </div>
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Main Menu"
              onClick={() => {
                if (open) {
                  setOpen(false);
                } else {
                  setOpen(true);
                }
              }}
            >
              {!open && <Menu className="size-4" />}
              {open && <X className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu — full-bleed borders; inner content matches page container */}
        {open && (
          <div className="fixed inset-x-0 top-[72px] bottom-0 z-50 flex flex-col overflow-x-hidden overflow-y-auto border-t border-dashed border-border bg-background lg:hidden">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem
                value="platform"
                className="border-b border-dashed border-border"
              >
                <AccordionTrigger className={mobileNavTriggerRow}>
                  <div className="flex min-w-0 flex-1 items-center">
                    <span className="text-left text-sm font-medium">
                      Platform
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 [&_a]:no-underline hover:[&_a]:no-underline">
                  <div className={cn(mobileNavInner, "space-y-6")}>
                    <div>
                      <div className="mb-4 text-xs tracking-widest text-muted-foreground uppercase">
                        Solutions
                      </div>
                      <div className="space-y-4">
                        {DATA_SOLUTIONS.map((solution, index) => (
                          <a
                            key={index}
                            href={solution.href}
                            className="group flex items-center gap-4 rounded-lg p-2 no-underline hover:bg-muted"
                          >
                            <div className="rounded-lg bg-muted p-2 shadow-sm">
                              <solution.icon className="size-4 text-muted-foreground transition-all group-hover:text-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">
                                {solution.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {solution.description}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-4 text-xs tracking-widest text-muted-foreground uppercase">
                        By Use Case
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {DATA_PLATFORM_CASE.map((useCase, index) => (
                          <a
                            key={index}
                            href={useCase.href}
                            className="group flex items-center gap-2 rounded-lg p-2 no-underline hover:bg-muted"
                          >
                            <div className="rounded-lg bg-muted p-1.5 shadow-sm">
                              <useCase.icon className="size-3 text-muted-foreground transition-all group-hover:text-foreground" />
                            </div>
                            <div className="truncate text-sm font-medium">
                              {useCase.title}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="resources"
                className="border-b border-dashed border-border"
              >
                <AccordionTrigger className={mobileNavTriggerRow}>
                  <div className="flex min-w-0 flex-1 items-center">
                    <span className="text-left text-sm font-medium">
                      Resources
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 [&_a]:no-underline hover:[&_a]:no-underline">
                  <div className={cn(mobileNavInner, "space-y-3")}>
                    {DATA_RESOURCES.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.href}
                        className="group flex items-center gap-4 rounded-lg p-2 no-underline hover:bg-muted"
                      >
                        <div className="rounded-lg bg-muted p-2 shadow-sm">
                          <resource.icon className="size-4 text-muted-foreground transition-all group-hover:text-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            {resource.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {resource.description}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="border-b border-dashed border-border">
              <a
                href="#"
                className={cn(
                  mobileNavInner,
                  "block py-4 text-left text-sm font-medium no-underline hover:no-underline",
                )}
              >
                Developer
              </a>
            </div>

            <div
              className={cn(
                mobileNavInner,
                "mt-auto flex flex-col gap-4 py-12",
              )}
            >
              <span className="text-center">
                Existing Customer?{" "}
                <a
                  href="#"
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  Login
                </a>
              </span>
              <Button className="relative" size="lg">
                Start now
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export { Header };
