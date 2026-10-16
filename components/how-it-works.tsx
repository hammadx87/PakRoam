import { MousePointerClick, CreditCard, QrCode, Plane } from "lucide-react";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick a data plan",
    description:
      "Choose the bundle that matches your trip — 1 GB for a week or 10 GB for a month, priced in PKR or USD.",
  },
  {
    icon: CreditCard,
    title: "Pay your way",
    description:
      "JazzCash, EasyPaisa, bank transfer, PayFast — or any international Visa/Mastercard from abroad.",
  },
  {
    icon: QrCode,
    title: "Scan the QR we send",
    description:
      "Your eSIM QR code, ICCID and activation code arrive on WhatsApp and on your order page within seconds.",
  },
  {
    icon: Plane,
    title: "Land connected",
    description:
      "Install the profile before you fly. Switch it on when you land and you're online — no PTA registration required.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-muted/40 section-y">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Online in Pakistan in four steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            No queues, no paperwork, no biometric verification. Everything happens from your
            phone before you even board.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li
              key={title}
              className="group relative rounded-xl border border-border bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
            >
              <span className="absolute right-5 top-5 text-4xl font-extrabold text-brand-100 transition-colors group-hover:text-brand-200">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
