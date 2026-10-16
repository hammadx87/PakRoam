import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "Do I need PTA registration to use a PakRoam eSIM?",
    answer:
      "No. A PakRoam eSIM is a roaming data profile from an international carrier, so it does not depend on your device's IMEI being registered with the PTA the way a local Pakistani SIM does. That's exactly why it's the go-to solution for overseas Pakistanis and travellers holding non-PTA devices. PTA policies do evolve, so if you also plan to use a local SIM long-term, keep an eye on the current DIRBS rules.",
  },
  {
    question: "Will the eSIM work on my phone?",
    answer:
      "It works on any eSIM-compatible, carrier-unlocked device — iPhone XS and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and most recent flagships from other brands. The quickest way to check: dial *#06# and look for an EID number. If your phone shows an EID, it supports eSIM.",
  },
  {
    question: "How is this different from buying a Jazz or Zong SIM at the airport?",
    answer:
      "A local Pakistani SIM requires biometric verification against your CNIC and may be blocked on devices that aren't PTA-registered. A PakRoam eSIM needs no CNIC, no biometrics and no queue — it's a data-only roaming profile delivered instantly to your WhatsApp, and it works regardless of your device's PTA status.",
  },
  {
    question: "When does my plan start counting?",
    answer:
      "Install the profile before you fly (it only needs Wi-Fi for installation). The data bundle activates and validity begins the first time the eSIM connects to a network in Pakistan, not when you buy it.",
  },
  {
    question: "Can I use hotspot / tethering and keep my WhatsApp number?",
    answer:
      "Yes to both. Hotspot and tethering are allowed on all PakRoam plans, and since the eSIM is data-only, your regular number and WhatsApp account keep working exactly as they do today.",
  },
  {
    question: "How do I receive my QR code and activation details?",
    answer:
      "Instantly after payment, in two places: your personal order page (example: pakroam.pk/orders/…) showing the QR code, ICCID, SM-DP+ address and activation code — and a WhatsApp message to the number you entered at checkout.",
  },
  {
    question: "Can I top up or extend my plan?",
    answer:
      "Yes — every plan can be topped up or extended from your order page or via WhatsApp support, and the new bundle stacks onto your existing profile without reinstalling anything.",
  },
  {
    question: "What if the eSIM doesn't activate when I land?",
    answer:
      "Message us on WhatsApp — support is available 24/7 in English and Urdu. We'll check the profile status with our provider and, if the profile is faulty, replace or refund it under our activation guarantee.",
  },
] as const;

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 section-y">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            PTA &amp; eSIM FAQ
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you asked about eSIMs in Pakistan
          </h2>
          <p className="mt-4 text-muted-foreground">
            Straight answers on PTA rules, device compatibility and how the eSIM actually works.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
