export type Currency = "PKR" | "USD";

export const CURRENCIES: Currency[] = ["PKR", "USD"];

export interface EsimPlan {
  /** Internal SKU used by checkout + orders */
  id: string;
  /** Package code registered with the eSIM Access provider */
  providerCode: string;
  name: string;
  tagline: string;
  dataLabel: string;
  /** `null` = unlimited data */
  dataAmountMb: number | null;
  durationDays: number;
  price: Record<Currency, number>;
  network: string;
  popular?: boolean;
  includes: string[];
}

/**
 * Retail pricing policy
 * ────────────────────
 * Prices are set at competitive market rates for Pakistan eSIMs
 * (Airalo / Holafly-style tiers) and carry a ~30% margin over our
 * white-label wholesale cost, i.e. wholesale ≈ retail ÷ 1.30
 * (e.g. Starter wholesale ≈ 769 PKR → 999 PKR retail).
 *
 * Target retail bands: 1GB ≈ 999–1,150 PKR ($3.50–4) · 3GB ≈ 1,999–2,250 PKR
 * ($7–8) · 5–20GB ≈ 4,500–8,000 PKR. These are the published prices shown on
 * plan cards, charged at checkout and embedded in order payloads — the rest
 * of the app reads them via `plan.price[currency]`.
 */
export const PROFIT_MARGIN_MULTIPLIER = 1.3;

export const PLANS: EsimPlan[] = [
  {
    id: "pk-1gb-7d",
    providerCode: "PK-1GB-7D",
    name: "Starter",
    tagline: "Quick trips & airport landings",
    dataLabel: "1 GB",
    dataAmountMb: 1024,
    durationDays: 7,
    price: { PKR: 999, USD: 3.5 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-3gb-15d",
    providerCode: "PK-3GB-15D",
    name: "Explorer",
    tagline: "Family visits & city hopping",
    dataLabel: "3 GB",
    dataAmountMb: 3072,
    durationDays: 15,
    price: { PKR: 2099, USD: 7.5 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-5gb-30d",
    providerCode: "PK-5GB-30D",
    name: "Traveler",
    tagline: "The best value for a full month",
    dataLabel: "5 GB",
    dataAmountMb: 5120,
    durationDays: 30,
    price: { PKR: 4499, USD: 15.5 },
    network: "Jazz / Zong 4G",
    popular: true,
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-10gb-30d",
    providerCode: "PK-10GB-30D",
    name: "Pro",
    tagline: "Work, streams & long stays",
    dataLabel: "10 GB",
    dataAmountMb: 10240,
    durationDays: 30,
    price: { PKR: 6999, USD: 24.99 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
];

export function getPlan(id: string | null | undefined): EsimPlan | null {
  if (!id) return null;
  return PLANS.find((plan) => plan.id === id) ?? null;
}

export function formatPrice(amount: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${amount.toFixed(2)}`;
  }
  return `Rs ${amount.toLocaleString("en-US")}`;
}
