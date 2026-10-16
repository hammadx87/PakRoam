import type { Currency } from "./plans";

/**
 * Payment gateway abstraction.
 *
 * Local methods (JazzCash, EasyPaisa, Bank Transfer, PayFast) plus
 * international cards. Each gateway is charged through its own credentials:
 * when a gateway's env vars are present it runs in LIVE mode; otherwise the
 * gateway runs in simulated mode during local development. In production,
 * simulated payments must be explicitly enabled with `PAYMENTS_ALLOW_MOCK=true`
 * — otherwise order creation fails loudly instead of silently issuing free
 * eSIMs.
 */

export type PaymentMethodId = "jazzcash" | "easypaisa" | "bank" | "payfast" | "card";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  group: "local" | "international";
  description: string;
  badge?: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "jazzcash",
    label: "JazzCash",
    group: "local",
    description: "Pay from your JazzCash mobile wallet",
  },
  {
    id: "easypaisa",
    label: "EasyPaisa",
    group: "local",
    description: "Pay from your EasyPaisa mobile wallet",
  },
  {
    id: "bank",
    label: "Bank Transfer",
    group: "local",
    description: "IBAN transfer — verified within 30 minutes",
  },
  {
    id: "payfast",
    label: "PayFast",
    group: "local",
    description: "One-click local cards & wallets via PayFast",
  },
  {
    id: "card",
    label: "Visa / Mastercard",
    group: "international",
    description: "International debit & credit cards in USD",
    badge: "International",
  },
];

export function getPaymentMethod(id: PaymentMethodId): PaymentMethod {
  const method = PAYMENT_METHODS.find((m) => m.id === id);
  if (!method) throw new Error(`Unknown payment method: ${id}`);
  return method;
}

export function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return typeof value === "string" && PAYMENT_METHODS.some((m) => m.id === value);
}

export interface PaymentRequest {
  method: PaymentMethodId;
  amount: number;
  currency: Currency;
  orderReference: string;
  contact: string;
}

export interface PaymentResult {
  status: "paid" | "pending";
  reference: string;
  mode: "live" | "mock";
  message?: string;
}

interface GatewayEnvCheck {
  required: string[];
}

/** Env vars each live gateway needs before it can be charged for real. */
const GATEWAY_REQUIREMENTS: Record<PaymentMethodId, GatewayEnvCheck> = {
  jazzcash: {
    required: ["JAZZCASH_MERCHANT_ID", "JAZZCASH_PASSWORD"],
  },
  easypaisa: {
    required: ["EASYPAISA_MERCHANT_ID", "EASYPAISA_SECURE_HASH"],
  },
  payfast: {
    required: ["PAYFAST_MERCHANT_ID", "PAYFAST_SECURE_HASH"],
  },
  card: {
    required: ["PAYFAST_MERCHANT_ID", "PAYFAST_SECURE_HASH"],
  },
  bank: {
    required: [],
  },
};

export function isGatewayConfigured(method: PaymentMethodId): boolean {
  const requirements = GATEWAY_REQUIREMENTS[method];
  if (requirements.required.length === 0) return false;
  return requirements.required.every((key) => Boolean(process.env[key]?.trim()));
}

export function isMockPaymentsAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.PAYMENTS_ALLOW_MOCK === "true";
}

/**
 * Charge (or schedule) a payment. Bank transfers always resolve as `pending`
 * since they require manual reconciliation; card/wallet methods resolve as
 * `paid` once their gateway confirms.
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  if (request.method === "bank") {
    return {
      status: "pending",
      reference: `BANK-${request.orderReference}`,
      mode: "mock",
      message:
        "Transfer the amount to our bank account and send the receipt on WhatsApp — your eSIM activates within 30 minutes of verification.",
    };
  }

  if (isGatewayConfigured(request.method)) {
    return chargeGateway(request);
  }

  if (isMockPaymentsAllowed()) {
    // Simulated gateway approval so local development can exercise the full
    // checkout → QR flow without real merchant credentials.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      status: "paid",
      reference: `MOCK-${request.orderReference}`,
      mode: "mock",
      message: "Simulated payment approval (development mode).",
    };
  }

  throw new Error(
    `Payment gateway "${request.method}" is not configured. Set its merchant ` +
      `credentials (${GATEWAY_REQUIREMENTS[request.method].required.join(", ")}) ` +
      `or set PAYMENTS_ALLOW_MOCK=true to explicitly enable simulated payments.`
  );
}

/**
 * Live gateway charge.
 *
 * This is the single integration point per provider: wire your provider SDK or
 * REST call here using the merchant credentials from the environment
 * (JazzCash / EasyPaisa / PayFast). The request/response contract of the rest
 * of the app stays unchanged.
 */
async function chargeGateway(request: PaymentRequest): Promise<PaymentResult> {
  switch (request.method) {
    case "jazzcash":
    case "easypaisa":
    case "payfast":
    case "card": {
      // Placeholder for the real gateway call, e.g.:
      //   const res = await fetch(JAZZCASH_API_URL, { ...signedParams });
      //   if (!res.ok) throw new Error("Payment declined");
      throw new Error(
        `Live ${getPaymentMethod(request.method).label} charging is not wired up yet. ` +
          "Implement chargeGateway() in lib/payments.ts with your merchant credentials."
      );
    }
    default:
      throw new Error(`Unhandled payment method: ${request.method}`);
  }
}
