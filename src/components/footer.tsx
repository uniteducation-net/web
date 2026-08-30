import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Product",
    links: [
      { name: "Overview", href: "#" },
      { name: "Pricing", href: "#" },
      { name: "Marketplace", href: "#" },
      { name: "Features", href: "#" },
      { name: "Integrations", href: "#" },
      { name: "Marketing", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Team", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" },
    ],
  },
];

interface FooterProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  className?: string;
}
const Footer = ({
  logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg",
    alt: "logo",
    title: "Shadcnblocks.com",
  },
  className,
}: FooterProps) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <footer>
          <div className="grid grid-cols-4 justify-between gap-10 lg:grid-cols-6 lg:text-left">
            <div className="col-span-4 flex w-full flex-col gap-6 lg:col-span-2">
              {/* Logo */}
              <div className="flex items-center gap-2 lg:justify-start">
                <a href="https://shadcnblocks.com">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    title={logo.title}
                    className="h-8"
                  />
                </a>
                <h2 className="text-xl font-semibold">{logo.title}</h2>
              </div>
              <p className="text-muted-foreground">
                A collection of 100+ responsive HTML templates for your startup
                business or side project.
              </p>
              <ul className="flex items-center space-x-6">
                <li className="font-medium duration-200 hover:scale-110 hover:text-muted-foreground">
                  <a href="#">
                    <FaInstagram className="size-6" />
                  </a>
                </li>
                <li className="font-medium duration-200 hover:scale-110 hover:text-muted-foreground">
                  <a href="#">
                    <FaFacebook className="size-6" />
                  </a>
                </li>
                <li className="font-medium duration-200 hover:scale-110 hover:text-muted-foreground">
                  <a href="#">
                    <FaTwitter className="size-6" />
                  </a>
                </li>
                <li className="font-medium duration-200 hover:scale-110 hover:text-muted-foreground">
                  <a href="#">
                    <FaLinkedin className="size-6" />
                  </a>
                </li>
              </ul>
            </div>
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="col-span-2 md:col-span-1">
                <h3 className="mb-5 font-medium">{section.title}</h3>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="font-medium hover:text-primary"
                    >
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-4 md:col-span-2">
              <h3 className="mb-5 font-medium">Newsletter</h3>
              <div className="grid gap-1.5">
                <div className="flex w-full items-center space-x-2">
                  <Input type="email" placeholder="Email" />
                  <Button type="submit">Subscribe</Button>
                </div>
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                By submitting, you agree to our
                <a href="#" className="ml-1 text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
          <div className="mt-20 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            <p>
              <span className="mr-1 font-bold text-primary">
                Shadcnblocks.com
              </span>
              © All rights reserved.
            </p>
            <p>
              Made with ❤️ by{" "}
              <a href="https://x.com/ausrobdev" className="text-primary">
                @ausrobdev
              </a>
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer };
