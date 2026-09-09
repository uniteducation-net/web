import { cn } from "@/lib/utils";

interface UNQuoteProps {
  className?: string;
}

const UNQuote = ({ className }: UNQuoteProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="flex flex-col items-center gap-6 border-y py-14 text-center md:py-20">
          <q className="block max-w-4xl font-heading text-2xl font-medium lg:text-3xl">
            New data collected for the Global Report on Teachers indicates
            that 44 million additional teachers are needed to achieve
            universal primary and secondary education by 2030.
          </q>
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <a
              href="https://unesdoc.unesco.org/ark:/48223/pf0000388832"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              UNESCO, 2024
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export { UNQuote };
