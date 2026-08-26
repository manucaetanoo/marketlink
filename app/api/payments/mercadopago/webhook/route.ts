import { NextRequest, NextResponse } from "next/server";
import {
  fetchMercadoPagoPayment,
  syncOrderWithMercadoPagoPayment,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/payments/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dataId =
      req.nextUrl.searchParams.get("data.id") ||
      req.nextUrl.searchParams.get("id") ||
      (body?.data?.id ? String(body.data.id) : null);
    const type =
      req.nextUrl.searchParams.get("type") ||
      req.nextUrl.searchParams.get("topic") ||
      body?.type;

    const isValidSignature = verifyMercadoPagoWebhookSignature({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId,
    });

    if (!isValidSignature) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    if (!dataId || type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const payment = await fetchMercadoPagoPayment(dataId);
    await syncOrderWithMercadoPagoPayment(payment);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Mercado Pago error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
