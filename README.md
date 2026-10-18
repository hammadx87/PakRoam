# PakRoam — eSIM for Pakistan

A production-ready **Next.js 14 (App Router)** platform selling Pakistan eSIM data plans to
overseas Pakistanis and travellers on non-PTA devices. Blue & clean-white SaaS design
(Stripe/Airalo-style), PKR & USD pricing, local + international payments, instant QR delivery,
and an order page with iOS/Android setup guides.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — app runs in simulated mode without it
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build && npm run start
```

## Environment variables

All secrets are **server-side only** (no `NEXT_PUBLIC_` prefix) and are read at runtime:

| Variable | Required | Purpose |
| --- | --- | --- |
| `ESIM_ACCESS_ACCESS_CODE` | In production | eSIM Access reseller access code |
| `ESIM_ACCESS_SECRET_KEY` | In production | eSIM Access secret key (also the default order-signing secret) |
| `ESIM_ACCESS_BASE_URL` | No | Override provider API root (default `https://backend.esimaccess.com/api/v1`) |
| `ESIM_ACCESS_ALLOW_MOCK` | No | `true` to allow simulated provisioning in production builds |
| `JAZZCASH_*` / `EASYPAISA_*` / `PAYFAST_*` | No | Live payment gateway credentials |
| `PAYMENTS_ALLOW_MOCK` | No | `true` to allow simulated payments in production builds |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical site URL for metadata/OG tags |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | No | Support number in international format, digits only (defaults to `12569563944`) |
| `ORDER_SIGNING_SECRET` | No | Dedicated secret for signing order URLs (falls back to `ESIM_ACCESS_SECRET_KEY`) |
| `WHATSAPP_AGENT_API_KEY` | To use WhatsApp | WhatsApp Agent API key for `/api/whatsapp` (server-side only, stored in `.env.local`) |
| `WHATSAPP_AGENT_API_URL` | No | Endpoint of the WhatsApp Agent API; unset = simulated sends in dev |
| `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_APP_SECRET` | No | Webhook verify token / Meta app secret for `X-Hub-Signature-256` |
| `WHATSAPP_ALLOW_MOCK` | No | `true` to allow simulated WhatsApp sending in production builds |

### Live vs. simulated mode (strict behavior)

- **eSIM provisioning** (`lib/esim-access.ts`): if `ESIM_ACCESS_ACCESS_CODE` **and**
  `ESIM_ACCESS_SECRET_KEY` are set, orders are purchased for real against the provider API
  (`X-Access-Key` / `X-Secret-Key` headers). If they are **missing**, the app falls back to
  simulated provisioning **in local development only**. In a production build without
  credentials, order creation fails with a clear error unless `ESIM_ACCESS_ALLOW_MOCK=true`
  is set explicitly — no fake eSIMs are ever issued silently.
- **Payments** (`lib/payments.ts`): each gateway (JazzCash, EasyPaisa, PayFast, cards) charges
  live once its merchant env vars are present; otherwise payments are simulated in development
  and blocked in production unless `PAYMENTS_ALLOW_MOCK=true`. Bank transfers always resolve
  as `pending` (manual reconciliation). Live gateway calls are wired at a single point —
  `chargeGateway()` — ready for your merchant SDK.

## Architecture

```
app/
  page.tsx                 Landing page (hero, plans, how-it-works, PTA FAQ, CTA)
  layout.tsx               Root layout: Inter font, header/footer, currency provider
  orders/[id]/page.tsx     Order confirmation: QR, ICCID, SM-DP+, activation code,
                           iOS/Android setup guides (server-rendered, noindex)
  api/orders/route.ts      POST: validate → charge → provision → signed order id
  api/orders/[id]/route.ts GET: decode/verify a signed order token
  api/whatsapp/route.ts    WhatsApp Agent: GET webhook verification,
                           POST inbound message → AI agent reply → outbound send
components/
  ui/                      Shadcn UI (button, card, badge, tabs, dialog-as-drawer,
                           accordion, select, input, label, separator)
  header.tsx, footer.tsx   Sticky header w/ PKR-USD switcher, footer w/ support links
  hero.tsx, trust-bar.tsx, plans-grid.tsx, checkout-drawer.tsx,
  how-it-works.tsx, faq.tsx, cta-band.tsx, copy-button.tsx
lib/
  esim-access.ts           eSIM Access provider client (live + mock, strict env checks)
  payments.ts              Payment gateway abstraction (local wallets, bank, cards)
  orders.ts                HMAC-signed order tokens — DB-free order persistence
  plans.ts                 Plan catalog with PKR/USD pricing
  currency.tsx             Currency context (PKR/USD) with localStorage persistence
  site.ts, utils.ts        Site config, cn()
  whatsapp.ts              WhatsApp Agent client: system prompt, bilingual agent
                           responder, outbound send via WHATSAPP_AGENT_API_KEY
```

### Order persistence (no database)

Orders are HMAC-signed and encoded into the order id itself
(`ord_<base64url payload>.<signature>`), so `/orders/[id]` renders from the URL alone. This
works across stateless serverless invocations (Netlify Functions) with zero extra services,
and tampered tokens fail signature verification and 404. To move to a real datastore, swap
`serializeOrder`/`parseOrder` in `lib/orders.ts` for DB reads — the `PakRoamOrder` shape stays
the same. Set `ORDER_SIGNING_SECRET` in production.

### QR codes

The order page renders the eSIM's `LPA:` activation string as an SVG QR code server-side
(`qrcode`), alongside the ICCID, SM-DP+ address and activation code for manual entry.

## WhatsApp Agent (`/api/whatsapp`)

The backend talks to the WhatsApp Agent API using `WHATSAPP_AGENT_API_KEY` (stored in
`.env.local`, server-side only):

- **GET `/api/whatsapp?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…`** — webhook
  verification handshake; echoes the challenge when the token matches (defaults to the API key,
  or set `WHATSAPP_VERIFY_TOKEN`).
- **POST `/api/whatsapp`** — accepts a Meta WhatsApp Cloud API webhook payload or a simple
  `{ "from": "+923…", "message": "5GB plan kitne ka hai?" }` body. The message is passed to the
  **PakRoam 24/7 AI Assistant** agent handler (`SYSTEM_PROMPT` in `lib/whatsapp.ts`), which
  answers in friendly English + Roman Urdu about the 1GB/3GB/5GB/10GB plans, non-PTA device
  usage, QR installation steps, and payments — then sends the reply back out via
  `sendWhatsAppMessage()`.
- **Auth:** `X-Api-Key` / `Authorization: Bearer` must match the key; Meta webhooks can be
  validated with `X-Hub-Signature-256` + `WHATSAPP_APP_SECRET`; unsigned requests are accepted
  in local development only.
- **Sending:** set `WHATSAPP_AGENT_API_URL` to the agent API endpoint (the key is sent as
  `Authorization: Bearer` + `X-Api-Key`, and the system prompt rides along as `system`). Without
  a URL, sends are simulated in local dev only.

Test it:

```bash
curl -X POST http://localhost:3000/api/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $WHATSAPP_AGENT_API_KEY" \
  -d '{"from":"+923001234567","message":"5GB plan kitne ka hai?"}'
```

## Deploy to Netlify

`netlify.toml` is preconfigured for the App Router:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

1. Push the repo to GitHub and import it in Netlify (or `netlify deploy --build`).
2. Set `ESIM_ACCESS_ACCESS_CODE` + `ESIM_ACCESS_SECRET_KEY` in **Site settings → Environment
   variables** for live provisioning.
3. Set payment gateway credentials for live payments (or leave unset and wire `chargeGateway()`).
4. Update `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SUPPORT_WHATSAPP`.

## Design system

Blue & clean-white palette (Stripe/Revolut/Airalo style) defined as CSS variables in
`app/globals.css` and Tailwind tokens in `tailwind.config.ts`:

- Primary vibrant blue `#2563EB` / dark `#1D4ED8`
- Accent electric sky blue `#0EA5E9`
- Backgrounds pure white `#FFFFFF` and soft slate `#F8FAFC`
- Dark-slate text `#0F172A`, rounded-xl cards with subtle shadows and hover glows

## Notes

- PakRoam is an independent eSIM reseller and is not affiliated with the PTA or any Pakistani
  operator. Marketing copy about PTA behavior should be reviewed against current DIRBS rules.
- Provider endpoint paths in `lib/esim-access.ts` (`ENDPOINTS`) follow the eSIM Access API
  convention; confirm them against your reseller contract at
  [docs.esimaccess.com](https://docs.esimaccess.com) — they are isolated in one constant so
  they're trivial to adjust.
