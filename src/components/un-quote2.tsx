import { cn } from "@/lib/utils";

interface UNQuote2Props {
  className?: string;
}

const UNQuote2 = ({ className }: UNQuote2Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="flex flex-col items-center gap-6 border-y py-14 text-center md:py-20">
          <q className="block max-w-4xl font-heading text-heading font-medium">
            Teachers are central to unlocking every learner’s potential and
            achieving Sustainable Development Goal 4 of inclusive, equitable
            and quality education for all.
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

export { UNQuote2 };
