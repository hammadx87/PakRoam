import Link from "next/link";
import { Signal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { whatsappSupportUrl } from "@/lib/site";

const NAV_LINKS = [
  { href: "#plans", label: "Plans" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#faq", label: "PTA FAQ" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-white/85 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="PakRoam home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-cta">
            <Signal className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Pak<span className="text-brand-600">Roam</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <CurrencySwitcher />
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <a
              href={whatsappSupportUrl("Hi PakRoam! I need help choosing an eSIM plan.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Support
            </a>
          </Button>
          <Button asChild size="sm" className="h-9 px-4">
            <Link href="#plans">Buy eSIM</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
