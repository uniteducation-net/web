import { ArrowRight, Scale, ScrollText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface LegalItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  lastUpdated?: string;
}

interface LegalOverviewProps {
  heading?: string;
  items?: LegalItem[];
  readText?: string;
  lastUpdatedText?: string;
  className?: string;
}

const LegalOverview = ({
  heading = "Legal",
  readText = "Read",
  lastUpdatedText = "Last updated",
  items = [
    {
      icon: <Scale />,
      title: "Legal Notice",
      description: "Who we are and how to reach us.",
      link: "#",
    },
    {
      icon: <ShieldCheck />,
      title: "Privacy Policy",
      description: "How we handle your data.",
      link: "#",
    },
    {
      icon: <ScrollText />,
      title: "Terms of Service",
      description: "The rules for using this site.",
      link: "#",
    },
  ],
  className,
}: LegalOverviewProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container px-0 md:px-8">
        <h1 className="mb-10 px-4 font-heading text-3xl font-semibold tracking-tighter md:mb-14 md:text-4xl">
          {heading}
        </h1>
        <div className="flex flex-col">
          <Separator />
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <div className="grid items-center gap-4 px-4 py-5 md:grid-cols-4">
                <div className="order-2 flex items-center gap-2 md:order-none">
                  <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                    {item.icon}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-heading font-semibold">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {lastUpdatedText}
                      {item.lastUpdated ? `: ${item.lastUpdated}` : ""}
                    </p>
                  </div>
                </div>
                <p className="order-1 font-heading text-2xl font-semibold tracking-tight md:order-none md:col-span-2">
                  {item.description}
                </p>
                <Button variant="outline" asChild>
                  <Link
                    className="order-3 ml-auto w-fit gap-2 md:order-none"
                    href={item.link}
                  >
                    <span>{readText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <Separator />
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export { LegalOverview };
export type { LegalOverviewProps, LegalItem };
