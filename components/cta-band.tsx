import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { whatsappSupportUrl } from "@/lib/site";

export function CtaBand() {
  return (
    <section className="container pb-20">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 px-6 py-14 text-center text-white shadow-[0_24px_60px_-24px_rgb(37_99_235_/_0.6)] sm:px-14">
        <div
          className="absolute inset-0 opacity-20 hero-grid"
          style={{ filter: "invert(1)" }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Flying to Pakistan soon? Land already connected.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Pick a plan, pay with JazzCash, EasyPaisa or your card, and scan your QR code before
            you even reach the gate.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-50 shadow-none">
              <Link href="#plans">
                Buy eSIM Now
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a
                href={whatsappSupportUrl("Hi PakRoam! I have a question before buying an eSIM.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden />
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
