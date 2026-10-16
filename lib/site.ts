export const siteConfig = {
  name: "PakRoam",
  tagline: "Stay Connected in Pakistan instantly — without the PTA hassle",
  description:
    "PakRoam delivers instant eSIM data for Pakistan. Scan a QR code, land in Pakistan, and get online in minutes — no PTA device registration, no SIM bazaar visits. Built for overseas Pakistanis and non-PTA device users.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  support: {
    whatsappNumber: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "923001234567",
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@pakroam.pk",
  },
} as const;

export function whatsappSupportUrl(message?: string): string {
  const base = `https://wa.me/${siteConfig.support.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
