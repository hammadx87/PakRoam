/**
 * WhatsApp Agent integration for PakRoam.
 *
 * - `WHATSAPP_AGENT_API_KEY` (server-side only) authenticates every call to
 *   the WhatsApp Agent API. It is read strictly at runtime, never bundled.
 * - `WHATSAPP_AGENT_API_URL` optionally points at the agent API root. When it
 *   is unset, outbound sending falls back to a simulated (mock) mode in local
 *   development only — production sends fail loudly unless
 *   `WHATSAPP_ALLOW_MOCK=true` is set explicitly.
 * - `answerWithAgent()` is the agent handler: a deterministic bilingual
 *   (English + Roman Urdu) responder driven by SYSTEM_PROMPT. If you point the
 *   route at a hosted LLM/agent endpoint, send SYSTEM_PROMPT along as the
 *   system instruction — the persona and knowledge stay identical.
 */

import { PLANS, formatPrice } from "./plans";
import { whatsappSupportUrl, siteConfig } from "./site";

export const SYSTEM_PROMPT = `You are "PakRoam 24/7 AI Assistant", the official WhatsApp assistant for PakRoam (pakroam.pk) — an eSIM provider for Pakistan built for overseas Pakistanis and travellers on non-PTA devices.

PERSONA & LANGUAGE
- Always introduce yourself as "PakRoam 24/7 AI Assistant" when the conversation starts or when asked who you are.
- Reply in helpful, friendly English mixed with natural Roman Urdu (e.g., "Bilkul! Aap Pakistan pohanch kar QR code scan kar sakte hain."). Keep messages short, warm, and easy to read on WhatsApp.
- Use short paragraphs or bullet points, at most a few lines. End with a friendly offer to help further.

WHAT YOU CAN HELP WITH
1. Pakistan eSIM data plans: 1GB/7 days, 3GB/15 days, 5GB/30 days (most popular), 10GB/30 days — priced in PKR and USD, delivered instantly on WhatsApp, data-only with hotspot allowed on Jazz/Zong 4G networks.
2. Non-PTA device usage: a PakRoam eSIM is a roaming data profile from an international carrier, so it does not require PTA (IMEI/DIRBS) registration like a local Pakistani SIM. It keeps working on non-PTA devices. Remind users PTA rules can change.
3. QR code installation: install the eSIM profile while on Wi-Fi before flying (iPhone: Settings → Cellular/Mobile Data → Add eSIM → Use QR Code; Android: Settings → Connections → SIM manager → Add eSIM). After landing in Pakistan, enable the eSIM line + Data Roaming; the bundle activates on first network connection. Manual entry uses the SM-DP+ address and activation code from the order page.
4. Payments: JazzCash, EasyPaisa, Bank Transfer, PayFast (local) and international Visa/Mastercard in USD.
5. Order status: direct users to their personal order page link (/orders/…) or offer WhatsApp support with a human.

RULES
- Never invent prices, ICCIDs or activation codes. Use only the plan table provided below; for anything account-specific, ask for the order reference and offer human support.
- If you don't know something, say so politely and offer human support on ${siteConfig.support.whatsappNumber}.
- Keep answers about eSIM legality factual: eSIMs avoid PTA device registration because they are roaming profiles; do not claim affiliation with the PTA or any operator.

PLAN TABLE (source of truth):
${PLANS.map(
  (p) =>
    `- ${p.dataLabel} / ${p.durationDays} days (${p.name}): ${formatPrice(p.price.PKR, "PKR")} or ${formatPrice(p.price.USD, "USD")} — ${p.network}`
).join("\n")}
Buy page: ${siteConfig.url}/#plans`;

export interface WhatsAppAgentConfig {
  apiKey: string;
  apiUrl: string | null;
}

/** Strictly read server-side env vars at request time. */
export function getWhatsAppAgentConfig(): WhatsAppAgentConfig | null {
  const apiKey = process.env.WHATSAPP_AGENT_API_KEY?.trim();
  if (!apiKey) return null;
  const apiUrl = process.env.WHATSAPP_AGENT_API_URL?.trim() || null;
  return { apiKey, apiUrl: apiUrl ? apiUrl.replace(/\/+$/, "") : null };
}

export function isMockSendingAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.WHATSAPP_ALLOW_MOCK === "true";
}

/* ────────────────────────────────────────────────────────────────
   Agent handler — bilingual (English + Roman Urdu) responder
   ──────────────────────────────────────────────────────────────── */

const GREETING = /\b(hi|hello|hey|salam|salaam|assalam|assalamualaikum|asalam)\b/i;
const PLANS_INTENT =
  /\b(plan|plans|package|bundle|data|kitna|kitne|price|pricing|rate|cost|1\s?gb|3\s?gb|5\s?gb|10\s?gb|one gb|three gb|five gb|ten gb)\b/i;
const PTA_INTENT = /\b(pta|imei|dirbs|registered|registration|blocked|block|non[- ]?pta)\b/i;
const QR_INTENT = /\b(qr|install|installation|setup|set up|activate|activation|scan|code|lagana|kaise|kese)\b/i;
const PAYMENT_INTENT = /\b(pay|payment|paying|jazzcash|easypaisa|bank|card|visa|mastercard|payfast|wallet)\b/i;
const SUPPORT_INTENT = /\b(human|agent|support|help me|contact|call|whatsapp number|representative)\b/i;
const THANKS_INTENT = /\b(thanks|thank you|shukriya|shukria|jazak|bohat acha|great|perfect)\b/i;

function plansAnswer(): string {
  const lines = PLANS.map(
    (p) =>
      `• ${p.dataLabel} / ${p.durationDays} days — ${formatPrice(p.price.PKR, "PKR")} (${formatPrice(p.price.USD, "USD")})${p.popular ? " ⭐" : ""}`
  );
  return (
    `🇵🇰 *PakRoam Pakistan eSIM Plans* (Jazz/Zong 4G, hotspot allowed):\n` +
    lines.join("\n") +
    `\n⭐ = Most Popular. Sab plans par instant QR code WhatsApp par milega.\n\n` +
    `Buy yahan karein: ${siteConfig.url}/#plans\n` +
    `Koi plan choose karne mein madad chahiye? Bata dein! 😊`
  );
}

function ptaAnswer(): string {
  return (
    `*Non-PTA device? Koi masla nahi!* ✅\n` +
    `A PakRoam eSIM is a roaming data profile from an international carrier — it does NOT need PTA / IMEI (DIRBS) registration like a local Pakistani SIM. Is liye overseas Pakistanis aur non-PTA device users ise bohat use karte hain.\n\n` +
    `• No CNIC, no biometrics, no PTA tax\n` +
    `• Works the moment you land and enable Data Roaming\n` +
    `• Note: PTA rules keep evolving — agar aap local SIM bhi use karte hain, current DIRBS rules zaroor check karein.\n\n` +
    `Aur kuch poochna ho to batayein! 🙂`
  );
}

function qrAnswer(): string {
  return (
    `*QR code installation — 2 minute mein:* 📲\n\n` +
    `1️⃣ *Before you fly:* Wi-Fi par apne phone se profile install karein.\n` +
    `   • iPhone: Settings → Cellular/Mobile Data → Add eSIM → *Use QR Code*\n` +
    `   • Android: Settings → Connections → SIM manager → Add eSIM → *Scan QR code*\n` +
    `2️⃣ Order page ka QR scan karein (ya SM-DP+ address + activation code manually enter karein — dono aapke order page par hote hain).\n` +
    `3️⃣ Profile ka naam "PakRoam" rakh dein aur landing tak OFF rakhein.\n` +
    `4️⃣ Pakistan pohanch kar: eSIM line ON karein + *Data Roaming* enable karein — bundle first network connection par activate ho jata hai. ✅\n\n` +
    `Full step-by-step guide aapke order page (${siteConfig.url}/orders/...) par bhi maujood hai.`
  );
}

function paymentAnswer(): string {
  return (
    `*PakRoam par aap yeh payments use kar sakte hain:* 💳\n\n` +
    `🇵🇰 *Local:* JazzCash · EasyPaisa · Bank Transfer · PayFast\n` +
    `🌍 *International:* Visa / Mastercard (USD)\n\n` +
    `Payment successful hote hi QR code + activation code foran WhatsApp par chala jata hai.`
  );
}

function supportAnswer(): string {
  return (
    `Bilkul, hum yahan hain! 👋\n` +
    `For order-specific help (activation, ICCID, refunds), apna *order reference* bhejein ya 24/7 WhatsApp support join karein:\n` +
    `${whatsappSupportUrl("Hi PakRoam! I need human support with my eSIM.")}\n\n` +
    `English aur Urdu — dono mein help milegi.`
  );
}

function thanksAnswer(): string {
  return `Shukriya! 😊 Aapka din khush rahe. Koi aur sawal ho — plans, non-PTA devices, ya installation — to foran pooch lein. PakRoam 24/7 aapke liye maujood hai! 🇵🇰`;
}

function fallbackAnswer(): string {
  return (
    `Assalam-o-Alaikum! 🇵🇰 Main *PakRoam 24/7 AI Assistant* hoon.\n` +
    `Main aapki in cheezon mein madad kar sakta hoon:\n` +
    `• eSIM plans (1GB/3GB/5GB/10GB) aur prices\n` +
    `• Non-PTA device par eSIM kaise chalta hai\n` +
    `• QR code installation steps\n` +
    `• Payments (JazzCash, EasyPaisa, Bank, PayFast, Cards)\n\n` +
    `Aap seedha bhi pooch sakte hain — jaise "5GB plan kitne ka hai?" ya "non-PTA phone par chalega?" 🙂`
  );
}

/**
 * Deterministic intent-based agent responder. Returns a friendly bilingual
 * (English + Roman Urdu) reply. Swap this for a hosted LLM call while keeping
 * SYSTEM_PROMPT as the system instruction — the route contract stays the same.
 */
export function answerWithAgent(message: string): string {
  const text = message.trim();
  if (!text) return fallbackAnswer();

  if (THANKS_INTENT.test(text)) return thanksAnswer();
  if (PTA_INTENT.test(text)) return ptaAnswer();
  if (QR_INTENT.test(text)) return qrAnswer();
  if (PAYMENT_INTENT.test(text)) return paymentAnswer();
  if (PLANS_INTENT.test(text)) return plansAnswer();
  if (SUPPORT_INTENT.test(text)) return supportAnswer();
  if (GREETING.test(text)) {
    return (
      `Assalam-o-Alaikum! 👋 Main *PakRoam 24/7 AI Assistant* hoon.\n` +
      `Pakistan ke liye instant eSIM data — bina PTA registration ke. Aap plans, non-PTA device usage, ya QR installation ke baare mein pooch sakte hain.\n\n` +
      `Aaj kya jaanna chahenge? 🙂`
    );
  }
  // Bare plan numbers ("5gb", "3 gb kacha") still route to plans
  if (/\b\d+\s?gb\b/i.test(text)) return plansAnswer();
  return fallbackAnswer();
}

/* ────────────────────────────────────────────────────────────────
   Outbound sending via the WhatsApp Agent API
   ──────────────────────────────────────────────────────────────── */

export interface SendWhatsAppResult {
  sent: boolean;
  mode: "live" | "mock";
  providerResponse?: unknown;
  error?: string;
}

/** Send an outbound WhatsApp message through the agent API. */
export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<SendWhatsAppResult> {
  const config = getWhatsAppAgentConfig();

  if (!config) {
    return {
      sent: false,
      mode: "mock",
      error:
        "WHATSAPP_AGENT_API_KEY is not configured. Set it in .env.local (or the site environment) to enable outbound WhatsApp messages.",
    };
  }

  if (!config.apiUrl) {
    if (!isMockSendingAllowed()) {
      return {
        sent: false,
        mode: "mock",
        error:
          "WHATSAPP_AGENT_API_URL is not configured. Set it to the WhatsApp Agent API endpoint, or set WHATSAPP_ALLOW_MOCK=true to explicitly enable simulated sending.",
      };
    }
    // Simulated delivery (development): the reply exists, no external call.
    console.log(`[pakroam][whatsapp:mock] → ${to}: ${text.slice(0, 120)}…`);
    return { sent: true, mode: "mock" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "X-Api-Key": config.apiKey,
      },
      body: JSON.stringify({
        // System instruction for hosted agent/LLM endpoints
        system: SYSTEM_PROMPT,
        to,
        type: "text",
        message: text,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        sent: false,
        mode: "live",
        error: `WhatsApp Agent API error (HTTP ${response.status})${body ? `: ${body.slice(0, 300)}` : ""}`,
      };
    }

    const providerResponse = await response.json().catch(() => null);
    return { sent: true, mode: "live", providerResponse };
  } catch (error) {
    return {
      sent: false,
      mode: "live",
      error: error instanceof Error ? error.message : "Unknown WhatsApp send error.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
