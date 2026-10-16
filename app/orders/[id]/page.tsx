import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  QrCode,
  Smartphone,
  Wifi,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/copy-button";
import { parseOrder } from "@/lib/orders";
import { getPaymentMethod } from "@/lib/payments";
import { formatPrice } from "@/lib/plans";
import { whatsappSupportUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your eSIM is ready",
  robots: { index: false, follow: false },
};

const IOS_STEPS = [
  "Stay connected to Wi-Fi and open Settings → Cellular/Mobile Data → Add eSIM → Use QR Code.",
  "Scan the QR code above (display it on another device, or print it). No second device? Tap “Enter Details Manually” and paste the SM-DP+ address and activation code below.",
  "Name the profile “PakRoam” and keep it switched off until you land.",
  "Set PakRoam as your Cellular Data line, and leave your primary SIM on for calls and WhatsApp.",
  "When you land in Pakistan, enable the PakRoam line and turn on Data Roaming. The bundle activates on the first network connection.",
];

const ANDROID_STEPS = [
  "Stay connected to Wi-Fi and open Settings → Connections → SIM manager → Add eSIM / Download a SIM.",
  "Choose “Scan QR code” and scan the QR code above, or tap “Enter activation code” and paste the details below.",
  "Confirm the download and label the profile “PakRoam”.",
  "In SIM manager, set PakRoam as the Mobile data SIM and enable Data Roaming for it.",
  "Once you land in Pakistan, the profile connects to Jazz/Zong 4G and your data starts working within a minute or two.",
];

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = parseOrder(params.id);
  if (!order) notFound();

  const activationCode = order.esim?.activationCode ?? "";
  const supportUrl = whatsappSupportUrl(
    `Hi PakRoam! I need help with my order (${order.payment.reference}).`
  );

  let qrSvg: string | null = null;
  if (activationCode) {
    try {
      qrSvg = await QRCode.toString(activationCode, {
        type: "svg",
        margin: 1,
        width: 240,
        color: { dark: "#0F172A", light: "#FFFFFF" },
      });
    } catch {
      qrSvg = null;
    }
  }

  const sentVia =
    order.contact.channel === "email"
      ? `your email ${order.contact.value}`
      : order.contact.channel === "whatsapp"
        ? `WhatsApp ${order.contact.value}`
        : `SMS on ${order.contact.value}`;

  return (
    <div className="container max-w-4xl py-12 md:py-16">
      {/* Status header */}
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {order.status === "active" ? (
            <CheckCircle2 className="h-9 w-9" aria-hidden />
          ) : (
            <Clock className="h-9 w-9" aria-hidden />
          )}
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {order.status === "active" ? "Your eSIM is ready!" : "Your eSIM is being activated"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {order.status === "active" ? (
            <>
              We've sent the QR code and activation details to {sentVia}. Scan it before you fly —
              your {order.plan.dataLabel} plan activates the first time it connects in Pakistan.
            </>
          ) : (
            <>
              Your payment is being verified. The QR code below will start working as soon as the
              transfer is confirmed — usually within 30 minutes.
            </>
          )}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary">Order: {order.payment.reference}</Badge>
          <Badge variant={order.status === "active" ? "success" : "warning"}>
            {order.status === "active" ? "Active" : "Awaiting payment verification"}
          </Badge>
        </div>
      </div>

      {/* Notices */}
      {order.payment.status === "pending" && order.payment.method === "bank" && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Bank transfer received as a request — please send your transfer receipt to{" "}
            <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
              WhatsApp support
            </a>{" "}
            to activate your eSIM within 30 minutes.
          </p>
        </div>
      )}

      {order.payment.mode === "mock" || order.esim?.mode === "mock" ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-muted/70 p-4 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold text-foreground">Simulated mode:</span> this order was
            created without live credentials — the QR code and ICCID are generated for testing
            (development environment only).
          </p>
        </div>
      ) : null}

      {/* QR + details */}
      <div className="mt-10 grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-[18px] w-[18px] text-brand-600" aria-hidden />
              Scan to install
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {qrSvg ? (
              <div
                className="rounded-xl border border-border p-3 [&>svg]:h-auto [&>svg]:w-[208px]"
                // QR payload is our own LPA activation string (data-only, no HTML)
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">QR unavailable — use manual entry below.</p>
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              On a second device or printout, scan during eSIM setup. Or choose “Enter details
              manually” and use the SM-DP+ address and activation code on the right.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-[18px] w-[18px] text-brand-600" aria-hidden />
              eSIM details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <DetailRow label="ICCID" value={order.esim?.iccid ?? "—"} copyable />
            <DetailRow label="SM-DP+ Address" value={order.esim?.smdpAddress ?? "—"} copyable />
            <DetailRow label="Activation Code (LPA)" value={activationCode || "—"} copyable />
            <Separator />
            <DetailRow
              label="Plan"
              value={`${order.plan.name} · ${order.plan.dataLabel} / ${order.plan.durationDays} days`}
            />
            <DetailRow
              label="Price paid"
              value={`${formatPrice(order.pricing.amount, order.pricing.currency)} · ${
                getPaymentMethod(order.payment.method).label
              }`}
            />
            <DetailRow label="Delivery" value={`Sent to ${sentVia}`} />
            <DetailRow
              label="Provider ref."
              value={order.esim?.providerRef ?? order.payment.reference}
              copyable
            />
          </CardContent>
        </Card>
      </div>

      {/* Setup guides */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <Tabs defaultValue="ios">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ios">iPhone (iOS)</TabsTrigger>
              <TabsTrigger value="android">Android</TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="mt-6">
              <SetupGuide steps={IOS_STEPS} />
            </TabsContent>
            <TabsContent value="android" className="mt-6">
              <SetupGuide steps={ANDROID_STEPS} />
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-brand-50/70 p-4 text-sm text-muted-foreground">
            <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <p>
              <span className="font-semibold text-foreground">Tip:</span> install the eSIM while
              you still have Wi-Fi — installation needs no data, but activation only happens on a
              Pakistani network. Keep Data Roaming on for the PakRoam line.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-border bg-muted/50 p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Stuck at any step?</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Our team is on WhatsApp 24/7 in English and Urdu — we'll walk you through installation
          or fix activation issues in minutes.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <a href={supportUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              WhatsApp Support
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/#plans">Buy another eSIM</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <p className="break-all text-right font-mono text-sm font-medium text-foreground">{value}</p>
        {copyable && value !== "—" && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}

function SetupGuide({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {index + 1}
          </span>
          <p className="pt-0.5 text-sm leading-relaxed text-muted-foreground">{step}</p>
        </li>
      ))}
    </ol>
  );
}
