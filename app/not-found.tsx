import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-brand-100">404</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">This page went out of coverage</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist. If you were trying to open an order, check
        the link from your WhatsApp message — order links are case-sensitive.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to plans</Link>
      </Button>
    </div>
  );
}
