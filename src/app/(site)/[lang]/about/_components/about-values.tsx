import {
  ArrowRight,
  Compass,
  Handshake,
  Heart,
  Scale,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeatureIconListItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
  href?: string;
}
interface Button {
  text: string;
  url: string;
  icon?: React.ReactNode;
}
interface Buttons {
  primary?: Button;
  secondary?: Button;
}

interface FeatureIconListProps {
  heading: string;
  description?: string;
  label?: string;
  features?: FeatureIconListItem[];
  buttons?: Buttons;
  className?: string;
}

type AboutValuesProps = FeatureIconListProps;
type Props = Partial<AboutValuesProps>;

const defaultProps: AboutValuesProps = {
  heading: "Our values",
  description: "These values are at the core of UnitEd’s work:",
  label: "Values",
  features: [
    {
      icon: <Scale className="size-6 shrink-0 lg:size-7" />,
      title: "Equity & Equal Access",
      description:
        "Where a child is born should never decide the quality of their education — so we keep the teaching knowledge that makes it possible free and open to every educator, everywhere.",
    },
    {
      icon: <Compass className="size-6 shrink-0 lg:size-7" />,
      title: "Empowerment",
      description:
        "We support emerging educators in building confidence and strengthening their teaching skills, at their own pace, through personalized learning paths.",
    },
    {
      icon: <Handshake className="size-6 shrink-0 lg:size-7" />,
      title: "Co-creation",
      description:
        "We build with teachers around the world, not just for them, so local voices and classroom realities shape the learning experience.",
    },
  ],
};

const MAX_FEATURES = 3;

const AboutValues = (props: Props) => {
  const { heading, description, features, label, buttons, className } = {
    ...defaultProps,
    ...props,
  };
  const items = (features ?? []).slice(0, MAX_FEATURES);
  const primaryButton = buttons?.primary;

  return (
    <section id="values" className={cn("py-32", className)}>
      <div className="container">
        <div className="flex flex-col gap-6 py-4 lg:py-8">
          {label && (
            <Badge
              variant="outline"
              className="w-fit gap-1 bg-card px-3 text-sm font-normal tracking-tight shadow-sm"
            >
              <Heart className="size-4" />
              <span>{label}</span>
            </Badge>
          )}
          <h2 className="max-w-3xl font-heading text-title font-semibold">
            {heading}
          </h2>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground">{description}</p>
            {primaryButton && (
              <a
                href={primaryButton.url}
                className="inline-flex items-center gap-1 text-primary"
              >
                <span className="underline">{primaryButton.text}</span>
                <ArrowRight className="size-4" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
          {items.map((item, index) => (
            <div className="flex gap-4" key={index}>
              <span className="mt-1 text-primary">{item.icon}</span>
              <div>
                <h3 className="text-lg font-medium tracking-tight lg:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { AboutValues };
