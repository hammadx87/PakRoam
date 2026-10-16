import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  QrCode,
  ShieldCheck,
  Zap,
  Headphones,
  CheckCircle2,
  Smartphone,
  Wifi,
  ArrowRight,
} from "lucide-react";

const HIGHLIGHTS = [
  { icon: QrCode, label: "QR code on WhatsApp in ~60 seconds" },
  { icon: ShieldCheck, label: "No PTA registration needed on non-PTA devices" },
  { icon: Zap, label: "4G/LTE data on Jazz & Zong networks" },
  { icon: Headphones, label: "24/7 WhatsApp support in English & Urdu" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Blue background wash + grid */}
      <div className="absolute inset-0 hero-grid" aria-hidden />
      <div
        className="absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-brand-600/15 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-52 left-[-8%] h-[380px] w-[380px] rounded-full bg-sky-400/15 blur-3xl"
        aria-hidden
      />

      <div className="container relative section-y">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-2xl animate-fade-up">
            <Badge variant="sky" className="mb-5 px-3 py-1.5 text-[13px]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              No PTA registration · No SIM bazaar
            </Badge>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
              Stay Connected in{" "}
              <span className="gradient-text">Pakistan instantly</span> without PTA hassles
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Buy a Pakistan eSIM in under a minute, scan the QR code we send straight to your
              WhatsApp, and land already online. Perfect for overseas Pakistanis and travellers on
              non-PTA devices.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="#plans">
                  Buy eSIM Now
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#how-it-works">How It Works</Link>
              </Button>
            </div>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* eSIM preview card */}
          <div className="relative mx-auto w-full max-w-md animate-fade-up lg:ml-auto">
            <div className="animate-float">
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 p-1 text-white shadow-[0_24px_60px_-20px_rgb(37_99_235_/_0.55)]">
                <div className="rounded-[calc(var(--radius)-2px)] bg-white p-6 text-foreground">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        eSIM · Pakistan
                      </p>
                      <p className="mt-1 text-2xl font-bold">5 GB · 30 Days</p>
                    </div>
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" aria-hidden />
                      Active
                    </Badge>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-brand-100">
                    <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-brand-600 to-sky-500" />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>1.9 GB used</span>
                    <span>3.1 GB left</span>
                  </div>

                  <dl className="mt-6 space-y-2.5 rounded-xl bg-muted p-4 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">ICCID</dt>
                      <dd className="font-mono font-medium">8991 •••• •••• 4821</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">SM-DP+ Address</dt>
                      <dd className="font-mono font-medium">esimaccess.com</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Network</dt>
                      <dd className="font-medium">Jazz / Zong 4G</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Wifi className="h-4 w-4 text-brand-600" aria-hidden />
                      Data-only · Hotspot allowed
                    </span>
                    <Smartphone className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -bottom-5 -left-4 rounded-xl border border-border bg-white px-4 py-3 shadow-card">
              <p className="text-xs font-semibold text-foreground">Delivered to WhatsApp</p>
              <p className="text-[11px] text-muted-foreground">QR + activation code, instantly</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
