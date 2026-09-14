"use client";

import type { LucideIcon } from "lucide-react";
import {
  Earth,
  GraduationCap,
  HandCoins,
  HandHeart,
  Handshake,
  HeartHandshake,
  Menu,
  Milestone,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
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

interface NavLink {
  href: string;
  icon: LucideIcon;
}

interface DropdownItem extends NavLink {
  title: string;
  description: string;
}

/** About-page section anchors; order matches dict.about.items. */
const LINKS_ABOUT: NavLink[] = [
  { href: "#project", icon: Earth },
  { href: "#mission", icon: Target },
  { href: "#values", icon: HeartHandshake },
  { href: "#milestones", icon: Milestone },
  { href: "#team", icon: Users },
];

const LINKS_GET_INVOLVED: NavLink[] = [
  { href: "#", icon: HandHeart },
  { href: "#", icon: Handshake },
  { href: "#", icon: UserPlus },
  { href: "#", icon: HandCoins },
  { href: "#", icon: GraduationCap },
];

interface HeaderDict {
  about: { label: string; items: { title: string; description: string }[] };
  getInvolved: { label: string; items: { title: string; description: string }[] };
  resources: string;
  updates: string;
  donate: string;
  menuLabel: string;
  existingCustomer: string;
  login: string;
  startNow: string;
}

interface HeaderProps {
  className?: string;
  /** Localized header labels and dropdown content, from the dictionary. */
  dict: HeaderDict;
  /** Localized chrome label for the language switcher, from the dictionary. */
  languageLabel: string;
  /** Locale-prefixed href for the About page (dropdown items append section anchors), e.g. "/en/about". */
  aboutHref: string;
  /** Locale-prefixed href for the Updates nav item, e.g. "/en/updates". */
  updatesHref: string;
  /** Locale-prefixed href for the Membership page ("Become a Member" dropdown item), e.g. "/en/membership". */
  membershipHref: string;
}

/** Same width + gutters as the header (`container` + `max-w-7xl`). */
const mobileNavInner = "container mx-auto max-w-7xl";

/** Accordion chevrons render after `children`, so padding must live on the trigger, not an inner wrapper. Matches the responsive `container` gutters. */
const mobileNavTriggerRow =
  "mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-4 hover:no-underline sm:px-6 lg:px-8";

const Header = ({
  className,
  dict,
  languageLabel,
  aboutHref,
  updatesHref,
  membershipHref,
}: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const dataAbout: DropdownItem[] = LINKS_ABOUT.map((link, i) => ({
    ...link,
    href: `${aboutHref}${link.href}`,
    ...dict.about.items[i],
  }));
  // Item order matches dict.getInvolved.items; "Become a Member" (index 2)
  // links to the membership route.
  const dataGetInvolved: DropdownItem[] = LINKS_GET_INVOLVED.map(
    (link, i) => ({
      ...link,
      href: i === 2 ? membershipHref : link.href,
      ...dict.getInvolved.items[i],
    }),
  );
  return (
    <section className={cn("inset-x-0 top-0 z-20 bg-background", className)}>
      <div className="container mx-auto">
        <div className="flex w-full items-center justify-between gap-12 py-4">
          <Logo animateIntro className="[&_.logo-text]:text-2xl" />
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-12 px-3.5 text-lg">
                  {dict.about.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="min-w-[420px] p-4">
                  <div className="grid grid-rows-1 gap-6">
                    {dataAbout.map((item, index) => (
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
                  {dict.getInvolved.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="min-w-[420px] p-4">
                  <div className="grid grid-rows-1 gap-6">
                    {dataGetInvolved.map((item, index) => (
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
              <Button variant="ghost" className="h-12 px-4 text-lg" asChild>
                <Link href="/resources">{dict.resources}</Link>
              </Button>
              <Button variant="ghost" className="h-12 px-4 text-lg" asChild>
                <Link href={updatesHref}>{dict.updates}</Link>
              </Button>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden items-center gap-4 lg:flex">
            <LanguageSwitcher languageLabel={languageLabel} />
            <Button className="h-12 px-4 text-lg">{dict.donate}</Button>
          </div>
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label={dict.menuLabel}
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
                      {dict.about.label}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 [&_a]:no-underline hover:[&_a]:no-underline">
                  <div className={cn(mobileNavInner, "space-y-4")}>
                    {dataAbout.map((item, index) => (
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
                      {dict.getInvolved.label}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 [&_a]:no-underline hover:[&_a]:no-underline">
                  <div className={cn(mobileNavInner, "space-y-3")}>
                    {dataGetInvolved.map((item, index) => (
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
              <Link
                href="/resources"
                className={cn(
                  mobileNavInner,
                  "block py-4 text-left text-sm font-medium no-underline hover:no-underline",
                )}
              >
                {dict.resources}
              </Link>
            </div>
            <div className="border-b border-dashed border-border">
              <Link
                href={updatesHref}
                className={cn(
                  mobileNavInner,
                  "block py-4 text-left text-sm font-medium no-underline hover:no-underline",
                )}
              >
                {dict.updates}
              </Link>
            </div>

            <div
              className={cn(
                mobileNavInner,
                "mt-auto flex flex-col gap-4 py-12",
              )}
            >
              <span className="text-center">
                {dict.existingCustomer}{" "}
                <a
                  href="#"
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {dict.login}
                </a>
              </span>
              <Button className="relative" size="lg">
                {dict.startNow}
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
