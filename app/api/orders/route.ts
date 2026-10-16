import { NextResponse } from "next/server";
import { z } from "zod";

import { getPlan } from "@/lib/plans";
import { processPayment } from "@/lib/payments";
import { provisionEsim } from "@/lib/esim-access";
import { serializeOrder, type OrderStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  planId: z.string().min(1),
  channel: z.enum(["whatsapp", "phone", "email"]),
  contact: z.string().trim().min(5).max(120),
  method: z.enum(["jazzcash", "easypaisa", "bank", "payfast", "card"]),
  currency: z.enum(["PKR", "USD"]).optional(),
});

function isValidContact(channel: "whatsapp" | "phone" | "email", value: string): boolean {
  if (channel === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  const digits = value.replace(/[\s()-]/g, "");
  return /^\+?\d{10,15}$/.test(digits);
}

function newOrderReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.floor(Math.random() * 1e6)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `PKRM-${stamp}-${suffix}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid order payload." },
      { status: 400 }
    );
  }

  const { planId, channel, contact, method } = parsed.data;
  const plan = getPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 404 });
  }
  if (!isValidContact(channel, contact)) {
    return NextResponse.json({ error: "Invalid contact details." }, { status: 400 });
  }

  const currency = parsed.data.currency ?? "PKR";
  const orderReference = newOrderReference();

  // 1) Charge the payment gateway (simulated in dev without credentials)
  let payment;
  try {
    payment = await processPayment({
      method,
      amount: plan.price[currency],
      currency,
      orderReference,
      contact,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed." },
      { status: 502 }
    );
  }

  // 2) Provision the eSIM profile through the eSIM Access provider API
  let esim;
  try {
    esim = await provisionEsim({ providerCode: plan.providerCode, contact, reference: orderReference });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown provider error.";
    console.error(`[pakroam] eSIM provisioning failed for ${orderReference}:`, detail);
    return NextResponse.json(
      {
        error:
          "We couldn't provision the eSIM profile. You have not been charged twice — " +
          `please quote order reference ${orderReference} to WhatsApp support.`,
        reference: orderReference,
      },
      { status: 502 }
    );
  }

  // 3) Persist the order as a signed token (no database required)
  const status: OrderStatus = payment.status === "paid" ? "active" : "processing";
  const orderId = serializeOrder({
    createdAt: new Date().toISOString(),
    status,
    plan: {
      id: plan.id,
      name: plan.name,
      dataLabel: plan.dataLabel,
      durationDays: plan.durationDays,
    },
    contact: { value: contact, channel },
    payment: {
      method,
      status: payment.status,
      reference: payment.reference,
      mode: payment.mode,
    },
    pricing: { amount: plan.price[currency], currency },
    esim,
  });

  return NextResponse.json(
    { orderId, status, reference: orderReference, url: `/orders/${orderId}` },
    { status: 201 }
  );
}
