import { Timer, Ban, Wallet, LifeBuoy } from "lucide-react";

const STATS = [
  { icon: Timer, value: "~60 sec", label: "From checkout to QR code" },
  { icon: Ban, value: "No PTA", label: "Works on non-PTA devices" },
  { icon: Wallet, value: "PKR & USD", label: "Local wallets & intl. cards" },
  { icon: LifeBuoy, value: "24/7", label: "WhatsApp human support" },
] as const;

export function TrustBar() {
  return (
    <section className="border-y border-border bg-muted/60" aria-label="Why travellers trust PakRoam">
      <div className="container grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={value} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-card">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-base font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
