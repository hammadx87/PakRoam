import crypto from "node:crypto";
import type { Currency } from "./plans";
import type { PaymentMethodId } from "./payments";

/**
 * Database-free order persistence.
 *
 * Orders are HMAC-signed and encoded directly into the order id, so
 * `/orders/[id]` renders from the URL alone — no database required, and it
 * works across stateless serverless invocations (Netlify Functions). The
 * signature makes tampering impossible: any modified payload fails verification
 * and 404s. To move to a real datastore later, swap `serializeOrder`/
 * `parseOrder` for DB reads while keeping the `PakRoamOrder` shape.
 */

export type OrderStatus = "active" | "processing" | "failed";

export interface PakRoamOrder {
  /** Public order id — a signed, URL-safe token */
  id: string;
  createdAt: string;
  status: OrderStatus;
  plan: {
    id: string;
    name: string;
    dataLabel: string;
    durationDays: number;
  };
  contact: {
    value: string;
    channel: "whatsapp" | "phone" | "email";
  };
  payment: {
    method: PaymentMethodId;
    status: "paid" | "pending";
    reference: string;
    mode: "live" | "mock";
  };
  pricing: {
    amount: number;
    currency: Currency;
  };
  esim: {
    iccid: string;
    smdpAddress: string;
    activationCode: string;
    providerRef: string;
    mode: "live" | "mock";
  } | null;
}

type SignedOrder = Omit<PakRoamOrder, "id">;

function getSigningSecret(): { secret: string; insecure: boolean } {
  const secret =
    process.env.ORDER_SIGNING_SECRET?.trim() ||
    process.env.ESIM_ACCESS_SECRET_KEY?.trim() ||
    "";
  if (secret) return { secret, insecure: false };
  return { secret: "pakroam-dev-insecure-order-secret", insecure: true };
}

let warnedInsecureSecret = false;

function sign(payloadB64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/** Create a signed order id from order data (id field is omitted from payload). */
export function serializeOrder(order: SignedOrder): string {
  const { secret, insecure } = getSigningSecret();
  if (insecure && process.env.NODE_ENV === "production" && !warnedInsecureSecret) {
    warnedInsecureSecret = true;
    console.warn(
      "[pakroam] ORDER_SIGNING_SECRET / ESIM_ACCESS_SECRET_KEY is not set — " +
        "order URLs are signed with the built-in development secret."
    );
  }
  const payloadB64 = Buffer.from(JSON.stringify(order), "utf8").toString("base64url");
  return `ord_${payloadB64}.${sign(payloadB64, secret).slice(0, 32)}`;
}

/** Verify + decode an order id. Returns null for tampered or malformed tokens. */
export function parseOrder(token: string | undefined | null): PakRoamOrder | null {
  if (!token || !token.startsWith("ord_")) return null;

  const body = token.slice("ord_".length);
  const separatorIndex = body.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const payloadB64 = body.slice(0, separatorIndex);
  const signature = body.slice(separatorIndex + 1);
  if (!payloadB64 || !signature) return null;

  const { secret } = getSigningSecret();
  const expected = sign(payloadB64, secret).slice(0, 32);

  // Constant-time comparison to avoid timing side channels
  const a = Buffer.from(signature.padEnd(32, "0"), "utf8");
  const b = Buffer.from(expected.padEnd(32, "0"), "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as SignedOrder;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.plan?.id !== "string" ||
      typeof parsed.contact?.value !== "string"
    ) {
      return null;
    }

    return { ...parsed, id: token };
  } catch {
    return null;
  }
}
