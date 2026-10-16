import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { CurrencyProvider } from "@/lib/currency";
import { siteConfig } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "PakRoam — eSIM for Pakistan | No PTA Registration Required",
    template: "%s · PakRoam",
  },
  description: siteConfig.description,
  keywords: [
    "eSIM Pakistan",
    "Pakistan eSIM",
    "non-PTA device eSIM",
    "PTA approved eSIM alternative",
    "roaming data Pakistan",
    "overseas Pakistanis",
    "Jazz eSIM",
    "Zong eSIM",
  ],
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "PakRoam — Stay Connected in Pakistan instantly without PTA hassles",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "PakRoam — eSIM for Pakistan",
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <CurrencyProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CurrencyProvider>
      </body>
    </html>
  );
}
