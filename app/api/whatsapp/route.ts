import { NextResponse } from "next/server";
import crypto from "node:crypto";

import {
  SYSTEM_PROMPT,
  answerWithAgent,
  getWhatsAppAgentConfig,
  isMockSendingAllowed,
  sendWhatsAppMessage,
} from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp Agent service route.
 *
 * GET  /api/whatsapp — webhook verification handshake (Meta-style):
 *      hub.mode=subscribe + hub.verify_token must match, then the route
 *      echoes hub.challenge back.
 * POST /api/whatsapp — inbound message webhook. Accepts the Meta WhatsApp
 *      Cloud API payload (entry[].changes[].value.messages[]) or a simple
 *      { from, message } JSON body, runs it through the PakRoam 24/7 AI
 *      Assistant agent handler, and sends the bilingual reply back out via
 *      the WhatsApp Agent API (simulated in local dev when no API URL is set).
 *
 * Authentication:
 *  - X-Api-Key / Authorization: Bearer must match WHATSAPP_AGENT_API_KEY, or
 *  - X-Hub-Signature-256 is validated against WHATSAPP_APP_SECRET (Meta
 *    webhook signature), or
 *  - unsigned requests are accepted in local development only.
 */

function timingSafeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function authorize(request: Request): { ok: true } | { ok: false; status: number; error: string } {
  const config = getWhatsAppAgentConfig();

  if (!config) {
    if (!isMockSendingAllowed()) {
      return {
        ok: false,
        status: 503,
        error: "WHATSAPP_AGENT_API_KEY is not configured.",
      };
    }
    return { ok: true };
  }

  // 1) Direct API callers: explicit key header must match
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerKey = request.headers.get("x-api-key")?.trim() || bearer;
  if (headerKey) {
    return timingSafeEquals(headerKey, config.apiKey)
      ? { ok: true }
      : { ok: false, status: 401, error: "Invalid API key." };
  }

  // 2) Meta-style webhook: validate the app-signature header
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (signature && appSecret) return { ok: true }; // verified in POST via body

  // 3) Unsigned request — allowed in development only
  if (!isMockSendingAllowed()) {
    return {
      ok: false,
      status: 401,
      error: "Missing API key or webhook signature.",
    };
  }
  return { ok: true };
}

function verifyHubSignature(request: Request, rawBody: string): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature || !appSecret) return true; // not applicable
  const [algo, digest] = signature.split("=");
  if (algo !== "sha256" || !digest) return false;
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return timingSafeEquals(digest, expected);
}

/* ── Webhook verification handshake ─────────────────────────── */
// Note: Meta's verification handshake carries no auth headers — possession
// of the verify token (compared in constant time below) IS the credential.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() || getWhatsAppAgentConfig()?.apiKey;
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") ?? "";

  if (mode === "subscribe" && verifyToken && token && timingSafeEquals(token, verifyToken)) {
    return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Verification failed." }, { status: 403 });
}

/* ── Inbound message → agent reply → outbound send ──────────── */
interface InboundMessage {
  from: string;
  text: string;
}

/** Accepts Meta Cloud API webhooks or a simple { from, message } body. */
function extractMessage(payload: unknown): InboundMessage | null {
  if (typeof payload !== "object" || payload === null) return null;
  const body = payload as Record<string, unknown>;

  // Simple shape: { from, message|text|body }
  const simpleFrom = typeof body.from === "string" ? body.from.trim() : "";
  const simpleText =
    (typeof body.message === "string" && body.message) ||
    (typeof body.text === "string" && body.text) ||
    (typeof body.body === "string" && body.body) ||
    "";
  if (simpleFrom && simpleText.trim()) {
    return { from: simpleFrom, text: simpleText.trim() };
  }

  // Meta WhatsApp Cloud API shape
  if (Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      const changes = (entry as Record<string, unknown>)?.changes;
      if (!Array.isArray(changes)) continue;
      for (const change of changes) {
        const value = (change as Record<string, unknown>)?.value as Record<string, unknown> | undefined;
        const messages = value?.messages;
        if (!Array.isArray(messages)) continue;
        for (const message of messages) {
          const msg = message as Record<string, unknown>;
          const from = typeof msg.from === "string" ? msg.from : "";
          const text =
            msg.type === "text" && typeof msg.text === "object" && msg.text !== null
              ? String((msg.text as Record<string, unknown>).body ?? "")
              : "";
          if (from && text.trim()) return { from, text: text.trim() };
        }
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  const authorized = authorize(request);
  if (!authorized.ok) {
    return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  }

  const rawBody = await request.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!verifyHubSignature(request, rawBody)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const inbound = extractMessage(payload);
  if (!inbound) {
    return NextResponse.json(
      { error: "No inbound message found. Expected { from, message } or a Meta webhook payload." },
      { status: 400 }
    );
  }

  // 1) Run the agent handler ("PakRoam 24/7 AI Assistant")
  const reply = answerWithAgent(inbound.text);

  // 2) Deliver the reply through the WhatsApp Agent API
  const delivery = await sendWhatsAppMessage(inbound.from, reply);

  return NextResponse.json({
    status: "ok",
    assistant: "PakRoam 24/7 AI Assistant",
    to: inbound.from,
    reply,
    delivered: delivery.sent,
    mode: delivery.mode,
    ...(delivery.error ? { deliveryError: delivery.error } : {}),
    // Included for integrations/tests; strip if you don't want it exposed.
    systemPromptPreview: SYSTEM_PROMPT.slice(0, 120),
  });
}
