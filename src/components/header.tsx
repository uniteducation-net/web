"use client";

import type { LucideIcon } from "lucide-react";
import {
  GraduationCap,
  HandCoins,
  HandHeart,
  Handshake,
  HeartHandshake,
  Menu,
  Milestone,
  Rocket,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
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

interface DropdownItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const DATA_ABOUT: DropdownItem[] = [
  {
    title: "The Project",
    description: "What we're building and why it matters.",
    href: "#",
    icon: Rocket,
  },
  {
    title: "Mission",
    description: "Our goal: education for every learner.",
    href: "#",
    icon: Target,
  },
  {
    title: "Values",
    description: "The principles that guide our work.",
    href: "#",
    icon: HeartHandshake,
  },
  {
    title: "Milestones",
    description: "Key moments on our journey so far.",
    href: "#",
    icon: Milestone,
  },
  {
    title: "Team",
    description: "Meet the people behind the project.",
    href: "#",
    icon: Users,
  },
];

const DATA_GET_INVOLVED: DropdownItem[] = [
  {
    title: "Become a Volunteer",
    description: "Give your time to support learners.",
    href: "#",
    icon: HandHeart,
  },
  {
    title: "Become a Partner",
    description: "Collaborate with us on shared goals.",
    href: "#",
    icon: Handshake,
  },
  {
    title: "Become a Member",
    description: "Join our community and shape our work.",
    href: "#",
    icon: UserPlus,
  },
  {
    title: "Become a Sponsor",
    description: "Fund learning opportunities that matter.",
    href: "#",
    icon: HandCoins,
  },
  {
    title: "Share Your Knowledge",
    description: "Teach, mentor, or create content with us.",
    href: "#",
    icon: GraduationCap,
  },
];

interface HeaderProps {
  className?: string;
  /** Localized chrome label for the language switcher, from the dictionary. */
  languageLabel: string;
}

/** Same width + gutters as the header (`container` + `max-w-7xl`). */
const mobileNavInner = "container mx-auto max-w-7xl";

/** Accordion chevrons render after `children`, so padding must live on the trigger, not an inner wrapper. Matches the responsive `container` gutters. */
const mobileNavTriggerRow =
  "mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-4 hover:no-underline sm:px-6 lg:px-8";

const Header = ({ className, languageLabel }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  return (
    <section className={cn("inset-x-0 top-0 z-20 bg-background", className)}>
      <div className="container mx-auto">
        <div className="flex w-full items-center justify-between gap-12 py-4">
          <Logo animateIntro className="[&_.logo-text]:text-2xl" />
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-12 px-3.5 text-lg">
                  About
                </NavigationMenuTrigger>
                <NavigationMenuContent className="min-w-[420px] p-4">
                  <div className="grid grid-rows-1 gap-6">
                    {DATA_ABOUT.map((item, index) => (
                      <NavigationMenuLink
                        key={index}
                        href={item.href}
                        className="group flex flex-row items-center first:mt-4 hover:bg-transparent"
                      >
                        <div className="mr-4 rounded-lg bg-muted p-4 shadow-sm">
                          <item.icon className="size-6 text-muted-foreground transition-all fade-in group-hover:text-foreground" />
                        </div>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="text-sm font-normal text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-12 px-3.5 text-lg">
                  Get Involved
                </NavigationMenuTrigger>
                <NavigationMenuContent className="min-w-[420px] p-4">
                  <div className="grid grid-rows-1 gap-6">
                    {DATA_GET_INVOLVED.map((item, index) => (
                      <NavigationMenuLink
                        key={index}
                        href={item.href}
                        className="group flex flex-row items-center first:mt-4 hover:bg-transparent"
                      >
                        <div className="mr-4 rounded-lg bg-muted p-4 shadow-sm">
                          <item.icon className="size-6 text-muted-foreground transition-all fade-in group-hover:text-foreground" />
                        </div>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="text-sm font-normal text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <Button variant="ghost" className="h-12 px-4 text-lg">
                Updates
              </Button>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden items-center gap-4 lg:flex">
            <LanguageSwitcher languageLabel={languageLabel} />
            <Button className="h-12 px-4 text-lg">Donate</Button>
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
                      About
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 [&_a]:no-underline hover:[&_a]:no-underline">
                  <div className={cn(mobileNavInner, "space-y-4")}>
                    {DATA_ABOUT.map((item, index) => (
                      <a
                        key={index}
                        href={item.href}
                        className="group flex items-center gap-4 rounded-lg p-2 no-underline hover:bg-muted"
                      >
                        <div className="rounded-lg bg-muted p-2 shadow-sm">
                          <item.icon className="size-4 text-muted-foreground transition-all group-hover:text-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </a>
                    ))}
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
                      Get Involved
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 [&_a]:no-underline hover:[&_a]:no-underline">
                  <div className={cn(mobileNavInner, "space-y-3")}>
                    {DATA_GET_INVOLVED.map((item, index) => (
                      <a
                        key={index}
                        href={item.href}
                        className="group flex items-center gap-4 rounded-lg p-2 no-underline hover:bg-muted"
                      >
                        <div className="rounded-lg bg-muted p-2 shadow-sm">
                          <item.icon className="size-4 text-muted-foreground transition-all group-hover:text-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
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
                Updates
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
              <div className="flex justify-center">
                <LanguageSwitcher languageLabel={languageLabel} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export { Header };
