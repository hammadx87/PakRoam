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

export const PLANS: EsimPlan[] = [
  {
    id: "pk-1gb-7d",
    providerCode: "PK-1GB-7D",
    name: "Starter",
    tagline: "Quick trips & airport landings",
    dataLabel: "1 GB",
    dataAmountMb: 1024,
    durationDays: 7,
    price: { PKR: 999, USD: 3.49 },
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
    price: { PKR: 2499, USD: 8.99 },
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
    price: { PKR: 3999, USD: 13.99 },
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
