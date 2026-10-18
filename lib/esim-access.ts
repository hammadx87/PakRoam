/**
 * eSIM Access provider client (https://docs.esimaccess.com).
 *
 * Reads `ESIM_ACCESS_ACCESS_CODE` / `ESIM_ACCESS_SECRET_KEY` at runtime on the
 * server only. When both credentials are present the app runs in LIVE mode and
 * provisions real eSIM profiles against the provider API. When they are absent
 * the app falls back to a simulated (mock) mode in local development only —
 * in production, mock provisioning must be explicitly enabled with
 * `ESIM_ACCESS_ALLOW_MOCK=true` (or `PAYMENTS_ALLOW_MOCK=true`), otherwise
 * order creation fails loudly.
 *
 * Failures of the LIVE purchase call itself (insufficient provider balance,
 * unknown package code, sandbox/test credentials, network errors) are caught
 * and downgraded to a simulated profile whenever mock provisioning is allowed,
 * so a testing environment never blocks checkout with a provision error.
 */

const DEFAULT_BASE_URL = "https://backend.esimaccess.com/api/v1";

/**
 * Provider endpoints. Kept in one place so they can be adjusted against your
 * reseller contract without touching the rest of the app.
 */
const ENDPOINTS = {
  purchase: "/order/purchase",
  orderStatus: (reference: string) => `/order/${encodeURIComponent(reference)}`,
} as const;

export class EsimAccessConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EsimAccessConfigError";
  }
}

export interface EsimAccessEnv {
  accessCode: string;
  secretKey: string;
  baseUrl: string;
}

/** Strictly read server-side env vars at request time (never bundled). */
export function getEsimAccessEnv(): EsimAccessEnv | null {
  const accessCode = process.env.ESIM_ACCESS_ACCESS_CODE?.trim();
  const secretKey = process.env.ESIM_ACCESS_SECRET_KEY?.trim();
  if (!accessCode || !secretKey) return null;

  const baseUrl = (process.env.ESIM_ACCESS_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(
    /\/+$/,
    ""
  );
  return { accessCode, secretKey, baseUrl };
}

export function isMockProvisioningAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ESIM_ACCESS_ALLOW_MOCK === "true" ||
    // Test/staging environments that already accept simulated payments also
    // get simulated eSIM provisioning when the live provider call fails.
    process.env.PAYMENTS_ALLOW_MOCK === "true"
  );
}

export type EsimAccessMode = "live" | "mock";

export function getEsimAccessMode(): EsimAccessMode {
  if (getEsimAccessEnv()) return "live";
  if (isMockProvisioningAllowed()) return "mock";
  throw new EsimAccessConfigError(
    "eSIM Access credentials are not configured. Set ESIM_ACCESS_ACCESS_CODE and " +
      "ESIM_ACCESS_SECRET_KEY, or set ESIM_ACCESS_ALLOW_MOCK=true / " +
      "PAYMENTS_ALLOW_MOCK=true to explicitly enable simulated provisioning."
  );
}

export interface ProvisionEsimInput {
  /** Provider package code, e.g. "PK-5GB-30D" */
  providerCode: string;
  /** Email / phone / WhatsApp number used as the delivery contact */
  contact: string;
  /** Our own order reference, echoed back by the provider for reconciliation */
  reference: string;
  quantity?: number;
}

export interface ProvisionedProfile {
  iccid: string;
  smdpAddress: string;
  /** Full LPA string, e.g. `LPA:1$esimaccess.com$XXXX-XXXX` — scan this as QR */
  activationCode: string;
  providerRef: string;
  mode: EsimAccessMode;
}

/**
 * Provision (purchase) an eSIM profile for the given package.
 *
 * In live mode a failed provider call falls back to a simulated profile when
 * mock provisioning is allowed (`PAYMENTS_ALLOW_MOCK=true`,
 * `ESIM_ACCESS_ALLOW_MOCK=true`, or a non-production build), so testing
 * environments are never blocked by provider-side failures. Without any of
 * those flags the error propagates and order creation fails loudly.
 */
export async function provisionEsim(
  input: ProvisionEsimInput
): Promise<ProvisionedProfile> {
  const mode = getEsimAccessMode();
  if (mode === "mock") return provisionMock(input);

  try {
    return await provisionLive(input);
  } catch (error) {
    if (!isMockProvisioningAllowed()) throw error;

    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `[esim-access] Live provisioning failed for order ${input.reference} ` +
        `(package ${input.providerCode}); issuing a simulated profile instead: ${reason}`
    );
    return provisionMock(input);
  }
}

interface EsimAccessApiResponse {
  code?: number | string;
  message?: string;
  success?: boolean;
  data?: Record<string, unknown>;
}

async function provisionLive(input: ProvisionEsimInput): Promise<ProvisionedProfile> {
  const env = getEsimAccessEnv();
  if (!env) throw new EsimAccessConfigError("eSIM Access credentials are not configured.");

  const response = await fetch(`${env.baseUrl}${ENDPOINTS.purchase}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Provider authentication: reseller access code + secret key
      "X-Access-Key": env.accessCode,
      "X-Secret-Key": env.secretKey,
    },
    body: JSON.stringify({
      packageId: input.providerCode,
      quantity: input.quantity ?? 1,
      externalOrderId: input.reference,
      contact: input.contact,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `eSIM Access API error (HTTP ${response.status})${body ? `: ${body.slice(0, 500)}` : ""}`
    );
  }

  const payload = (await response.json()) as EsimAccessApiResponse;
  if (payload.success === false || (payload.code && String(payload.code) !== "0")) {
    throw new Error(`eSIM Access API rejected the order: ${payload.message ?? "unknown error"}`);
  }

  const data = (payload.data ?? payload) as Record<string, unknown>;
  const pick = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
  };

  const iccid = pick("iccid", "ICCID");
  const smdpAddress = pick("smdpAddress", "smdp", "SM-DP+ Address", "matchingId") ?? "esimaccess.com";
  const activationCode = pick("activationCode", "qrCode", "lpaCode", "LPA");
  const providerRef = pick("orderNo", "orderNumber", "orderRef", "transactionId") ?? input.reference;

  if (!iccid || !activationCode) {
    throw new Error(
      "eSIM Access returned an incomplete profile (missing ICCID or activation code)."
    );
  }

  return { iccid, smdpAddress, activationCode, providerRef, mode: "live" };
}

/**
 * Simulated provider purchase flow: structurally valid test profile (ICCID,
 * SM-DP+ address and `LPA:` activation code that renders as a scannable QR).
 * `input` is accepted for signature parity with the live path.
 */
async function provisionMock(_input: ProvisionEsimInput): Promise<ProvisionedProfile> {
  // Simulate network latency so the UI exercises its loading states.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const iccid = `8991${randomDigits(16)}`;
  const smdpAddress = "esimaccess.com";
  const token = Array.from({ length: 3 }, () => randomChunk(4)).join("-");
  const activationCode = `LPA:1$${smdpAddress}$${token}`;

  return {
    iccid,
    smdpAddress,
    activationCode,
    providerRef: `EA-MOCK-${randomDigits(8)}`,
    mode: "mock",
  };
}

/** Query the provider for the latest status of a provisioned order. */
export async function getOrderStatus(
  providerRef: string
): Promise<{ known: boolean; status?: string; raw?: unknown }> {
  const env = getEsimAccessEnv();
  if (!env) return { known: false };

  try {
    const response = await fetch(`${env.baseUrl}${ENDPOINTS.orderStatus(providerRef)}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Access-Key": env.accessCode,
        "X-Secret-Key": env.secretKey,
      },
    });
    if (!response.ok) return { known: false };
    const payload = (await response.json()) as EsimAccessApiResponse & {
      data?: { status?: string };
    };
    return { known: true, status: payload.data?.status, raw: payload };
  } catch {
    return { known: false };
  }
}

function randomDigits(length: number): string {
  let out = "";
  while (out.length < length) {
    out += Math.floor(Math.random() * 1e14).toString();
  }
  return out.slice(0, length);
}

function randomChunk(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
    ""
  );
}
