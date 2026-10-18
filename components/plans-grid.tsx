"use client";

import { useState } from "react";
import { Check, Crown, Signal } from "lucide-react";

import { PLANS, formatPrice, type EsimPlan } from "@/lib/plans";
import { whatsappSupportUrl } from "@/lib/site";
import { useCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutDrawer } from "@/components/checkout-drawer";

export function PlansGrid() {
  const { currency } = useCurrency();
  const [selectedPlan, setSelectedPlan] = useState<EsimPlan | null>(null);

  return (
    <section id="plans" className="scroll-mt-20 section-y">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            eSIM data packages
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple data plans for Pakistan
          </h2>
          <p className="mt-4 text-muted-foreground">
            All prices shown in {currency === "PKR" ? "PKR (Pakistani Rupees)" : "USD (US Dollars)"}.
            Switch currency any time from the header.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={
                "relative flex flex-col transition-all hover:-translate-y-1 hover:shadow-card-hover " +
                (plan.popular ? "border-2 border-brand-600 shadow-card-hover" : "")
              }
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 shadow-cta">
                  <Crown className="h-3 w-3" aria-hidden />
                  Most Popular
                </Badge>
              )}

              <CardContent className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Signal className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                    {plan.network}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

                <div className="mt-5">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">
                    {plan.dataLabel}
                  </span>
                  <span className="ml-1.5 text-sm text-muted-foreground">
                    / {plan.durationDays === 1 ? "1 day" : `${plan.durationDays} days`}
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold text-brand-600">
                  {formatPrice(plan.price[currency], currency)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  one-time · incl. all taxes
                </p>

                <ul className="mt-5 flex-1 space-y-2 border-t border-border pt-5">
                  {plan.includes.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-6 w-full"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => setSelectedPlan(plan)}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Not sure which plan you need?{" "}
          <a
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
            href={whatsappSupportUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask us on WhatsApp
          </a>{" "}
          — we reply in English &amp; Urdu.
        </p>
      </div>

      <CheckoutDrawer plan={selectedPlan} onPlanChange={setSelectedPlan} />
    </section>
  );
}
