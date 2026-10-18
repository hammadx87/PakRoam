export const siteConfig = {
  name: "PakRoam",
  tagline: "Stay Connected in Pakistan instantly — without the PTA hassle",
  description:
    "PakRoam delivers instant eSIM data for Pakistan. Scan a QR code, land in Pakistan, and get online in minutes — no PTA device registration, no SIM bazaar visits. Built for overseas Pakistanis and non-PTA device users.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  support: {
    whatsappNumber: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "12569563944",
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@pakroam.pk",
  },
} as const;

/**
 * Canonical click-to-chat prefill text. Used by `whatsappSupportUrl()` so every
 * generic support link resolves to exactly:
 * https://wa.me/12569563944?text=Hi%20PakRoam%20Support%2C%20I%20need%20help%20with%20my%20eSIM
 */
export const SUPPORT_WHATSAPP_MESSAGE = "Hi PakRoam Support, I need help with my eSIM";

export function whatsappSupportUrl(message: string = SUPPORT_WHATSAPP_MESSAGE): string {
  const base = `https://wa.me/${siteConfig.support.whatsappNumber}`;
  return `${base}?text=${encodeURIComponent(message)}`;
}
