import { HomeHero } from "@/components/home-hero";
import { HowItWorks } from "@/components/how-it-works";
import { UNQuote } from "@/components/un-quote";

export default function Home() {
  return (
    <>
      <HomeHero />
      <UNQuote />
      <HowItWorks />
    </>
  );
}
