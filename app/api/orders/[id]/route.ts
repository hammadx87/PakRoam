import { NextResponse } from "next/server";

import { parseOrder } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Look up an order from its signed token (used for debugging / polling). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const order = parseOrder(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
