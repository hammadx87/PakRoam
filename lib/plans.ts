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
  /** `null` = unlimited data. For daily-boost SKUs this is the total bundle */
  dataAmountMb: number | null;
  durationDays: number;
  price: Record<Currency, number>;
  network: string;
  popular?: boolean;
  includes: string[];
}

/**
 * Retail pricing policy
 * ─────────────────────
 * Budget-friendly retail prices at ~280 PKR per USD (PKR prices are the
 * published source of truth; USD is the equivalent). These are the prices
 * shown on plan cards, charged at checkout and embedded in order payloads —
 * the rest of the app reads them via `plan.price[currency]`.
 *
 * `providerCode` must exist in the eSIM Access provider catalog for live
 * provisioning; the 1GB/7D, 3GB/15D, 5GB/30D and 10GB/30D codes are the
 * originally registered ones, the remaining tiers need their catalog entries
 * activated before going on sale.
 */
export const PLANS: EsimPlan[] = [
  {
    id: "pk-100mb-7d",
    providerCode: "PK-100MB-7D",
    name: "Mini",
    tagline: "Ultra-light browsing & WhatsApp",
    dataLabel: "100 MB",
    dataAmountMb: 100,
    durationDays: 7,
    price: { PKR: 200, USD: 0.7 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-500mb-7d",
    providerCode: "PK-500MB-7D",
    name: "Lite",
    tagline: "Maps, mail & chats all week",
    dataLabel: "500 MB",
    dataAmountMb: 500,
    durationDays: 7,
    price: { PKR: 300, USD: 1.05 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-500mb-1d",
    providerCode: "PK-500MB-1D",
    name: "Lite Daily",
    tagline: "One-day data refill on landing",
    dataLabel: "500 MB",
    dataAmountMb: 500,
    durationDays: 1,
    price: { PKR: 250, USD: 0.9 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-1gb-1d",
    providerCode: "PK-1GB-1D",
    name: "Starter Daily",
    tagline: "A full gig for your arrival day",
    dataLabel: "1 GB",
    dataAmountMb: 1024,
    durationDays: 1,
    price: { PKR: 400, USD: 1.4 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-2gb-1d",
    providerCode: "PK-2GB-1D",
    name: "Daily Boost",
    tagline: "Heavy arrival-day usage bucket",
    dataLabel: "2 GB",
    dataAmountMb: 2048,
    durationDays: 1,
    price: { PKR: 750, USD: 2.7 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-1gb-7d",
    providerCode: "PK-1GB-7D",
    name: "Starter",
    tagline: "Quick trips & airport landings",
    dataLabel: "1 GB",
    dataAmountMb: 1024,
    durationDays: 7,
    price: { PKR: 450, USD: 1.6 },
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
    price: { PKR: 1100, USD: 3.9 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-3gb-30d",
    providerCode: "PK-3GB-30D",
    name: "Explorer Monthly",
    tagline: "Lean monthly plan for calls & maps",
    dataLabel: "3 GB",
    dataAmountMb: 3072,
    durationDays: 30,
    price: { PKR: 1150, USD: 4.1 },
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
    price: { PKR: 1800, USD: 6.4 },
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
    price: { PKR: 2900, USD: 10.35 },
    network: "Jazz / Zong 4G",
    includes: ["Instant QR delivery", "Hotspot / tethering allowed", "Top-ups available"],
  },
  {
    id: "pk-20gb-30d",
    providerCode: "PK-20GB-30D",
    name: "Max",
    tagline: "Heavy-duty data for long stays",
    dataLabel: "20 GB",
    dataAmountMb: 20480,
    durationDays: 30,
    price: { PKR: 5500, USD: 19.6 },
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
