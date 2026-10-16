"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  MessageCircle,
  Smartphone,
  Wallet,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatPrice, type EsimPlan } from "@/lib/plans";
import { useCurrency } from "@/lib/currency";
import {
  PAYMENT_METHODS,
  type PaymentMethodId,
} from "@/lib/payments";

type ContactChannel = "whatsapp" | "phone" | "email";

const CHANNELS: { id: ContactChannel; label: string; icon: typeof MessageCircle; placeholder: string }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "+92 3XX XXXXXXX" },
  { id: "phone", label: "Phone / SMS", icon: Smartphone, placeholder: "+92 3XX XXXXXXX" },
  { id: "email", label: "Email", icon: Mail, placeholder: "you@example.com" },
];

const METHOD_ICONS: Record<PaymentMethodId, typeof Wallet> = {
  jazzcash: Smartphone,
  easypaisa: Wallet,
  bank: Landmark,
  payfast: ShieldCheck,
  card: CreditCard,
};

function isValidContact(channel: ContactChannel, value: string): boolean {
  const trimmed = value.trim();
  if (channel === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
  }
  const digits = trimmed.replace(/[\s()-]/g, "");
  return /^\+?\d{10,15}$/.test(digits);
}

export function CheckoutDrawer({
  plan,
  onPlanChange,
}: {
  plan: EsimPlan | null;
  onPlanChange: (plan: EsimPlan | null) => void;
}) {
  const router = useRouter();
  const { currency } = useCurrency();

  const [channel, setChannel] = useState<ContactChannel>("whatsapp");
  const [contact, setContact] = useState("");
  const [method, setMethod] = useState<PaymentMethodId>("jazzcash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localMethods = useMemo(() => PAYMENT_METHODS.filter((m) => m.group === "local"), []);
  const internationalMethods = useMemo(
    () => PAYMENT_METHODS.filter((m) => m.group === "international"),
    []
  );

  const contactValid = isValidContact(channel, contact);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!plan || !contactValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          channel,
          contact: contact.trim(),
          method,
          currency,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { orderId?: string; error?: string }
        | null;

      if (!response.ok || !data?.orderId) {
        setError(data?.error ?? "We couldn't create your order. Please try again.");
        return;
      }

      router.push(`/orders/${data.orderId}`);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={plan !== null} onOpenChange={(open) => !open && onPlanChange(null)}>
      <DialogContent aria-describedby="checkout-description">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-xl">Checkout</DialogTitle>
          <DialogDescription id="checkout-description">
            {plan ? `${plan.name} · ${plan.dataLabel} for ${plan.durationDays} days` : ""}
          </DialogDescription>
        </DialogHeader>

        {plan && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order summary */}
            <div className="rounded-xl border border-border bg-muted/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {plan.name} — {plan.dataLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plan.durationDays} days · {plan.network} · data-only
                  </p>
                </div>
                <p className="text-lg font-bold text-brand-600">
                  {formatPrice(plan.price[currency], currency)}
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-foreground">
                Where should we send your eSIM?{" "}
                <span className="font-normal text-muted-foreground">(QR + activation code)</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map((option) => {
                  const Icon = option.icon;
                  const active = channel === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setChannel(option.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-all",
                        active
                          ? "border-brand-600 bg-brand-50 text-brand-700 shadow-glow"
                          : "border-border bg-white text-muted-foreground hover:border-brand-200 hover:text-foreground"
                      )}
                      aria-pressed={active}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <Input
                type={channel === "email" ? "email" : "tel"}
                inputMode={channel === "email" ? "email" : "tel"}
                placeholder={CHANNELS.find((c) => c.id === channel)?.placeholder}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                aria-label="Contact details for eSIM delivery"
                required
              />
              {contact && !contactValid && (
                <p className="text-xs text-destructive">
                  {channel === "email"
                    ? "Please enter a valid email address."
                    : "Please enter a valid phone number (10–15 digits)."}
                </p>
              )}
            </div>

            <Separator />

            {/* Payment method */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Payment method</p>

              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Local payments
              </p>
              <div className="grid gap-2">
                {localMethods.map((option) => (
                  <MethodRow
                    key={option.id}
                    id={option.id}
                    label={option.label}
                    description={option.description}
                    badge={option.badge}
                    selected={method === option.id}
                    onSelect={() => setMethod(option.id)}
                  />
                ))}
              </div>

              <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                International cards
              </p>
              <div className="grid gap-2">
                {internationalMethods.map((option) => (
                  <MethodRow
                    key={option.id}
                    id={option.id}
                    label={option.label}
                    description={option.description}
                    badge={option.badge}
                    selected={method === option.id}
                    onSelect={() => setMethod(option.id)}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <Button type="submit" size="lg" className="w-full" disabled={submitting || !contactValid}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Processing…
                  </>
                ) : (
                  <>
                    Pay {formatPrice(plan.price[currency], currency)} &amp; get eSIM
                  </>
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Secure checkout · Your QR code arrives within seconds of payment
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MethodRow({
  label,
  description,
  badge,
  selected,
  onSelect,
  id,
}: {
  label: string;
  description: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
  id: PaymentMethodId;
}) {
  const Icon = METHOD_ICONS[id];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-all",
        selected
          ? "border-brand-600 bg-brand-50/70 shadow-glow"
          : "border-border bg-white hover:border-brand-200"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-brand-600 text-white" : "bg-secondary text-muted-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {badge && (
            <Badge variant="secondary" className="text-[10px]">
              {badge}
            </Badge>
          )}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-brand-600" : "border-muted-foreground/30"
        )}
        aria-hidden
      >
        {selected && <span className="h-2 w-2 rounded-full bg-brand-600" />}
      </span>
    </button>
  );
}
