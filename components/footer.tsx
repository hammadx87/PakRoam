import Link from "next/link";
import { MessageCircle, Mail, Signal } from "lucide-react";

import { siteConfig, whatsappSupportUrl } from "@/lib/site";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#plans", label: "Data Plans" },
      { href: "#how-it-works", label: "How It Works" },
      { href: "#faq", label: "PTA & eSIM FAQ" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: whatsappSupportUrl("Hi PakRoam! I need support."), label: "WhatsApp Support", external: true },
      { href: `mailto:${siteConfig.support.email}`, label: siteConfig.support.email, external: true },
    ],
  },
] as const;

const PAYMENT_LABELS = ["JazzCash", "EasyPaisa", "Bank Transfer", "PayFast", "Visa", "Mastercard"];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/60">
      <div className="container section-y">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-sky-500 text-white">
                <Signal className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-lg font-bold tracking-tight">
                Pak<span className="text-brand-600">Roam</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Instant eSIM data for Pakistan. Built for overseas Pakistanis and non-PTA device
              users — no SIM bazaar, no device registration, no hassle.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-brand-700"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-brand-700"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={whatsappSupportUrl("Hi PakRoam! I need support.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand-700"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp support
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.support.email}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand-700"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {siteConfig.support.email}
                </a>
              </li>
            </ul>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PAYMENT_LABELS.map((label) => (
                <span
                  key={label}
                  className="rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="max-w-xl">
            {siteConfig.name} is an independent eSIM reseller and is not affiliated with, endorsed
            by, or connected to the Pakistan Telecommunication Authority (PTA) or any Pakistani
            mobile network operator.
          </p>
        </div>
      </div>
    </footer>
  );
}
