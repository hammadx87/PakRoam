import { Hero } from "@/components/hero";
import { TrustBar } from "@/components/trust-bar";
import { PlansGrid } from "@/components/plans-grid";
import { HowItWorks } from "@/components/how-it-works";
import { Faq } from "@/components/faq";
import { CtaBand } from "@/components/cta-band";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <PlansGrid />
      <HowItWorks />
      <Faq />
      <CtaBand />
    </>
  );
}
