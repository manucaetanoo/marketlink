import { NextResponse } from "next/server";
import { createMercadoPagoPayment } from "@/lib/payments/mercadopago";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/lib/prisma-enums";
import { rateLimit } from "@/lib/rate-limit";

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(req: Request) {
  try {
    const limit = rateLimit(req, {
      key: "payments:mercadopago:confirm",
      limit: 20,
      windowMs: 60_000,
    });

    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const body = await req.json();
    const orderId = cleanString(body?.orderId, 191);
    const formData = body?.formData;

    if (!orderId || !formData || typeof formData !== "object") {
      return NextResponse.json(
        { ok: false, error: "Datos de pago incompletos" },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentStatus: true },
    });

    if (
      !existingOrder ||
      existingOrder.status !== OrderStatus.PENDING ||
      existingOrder.paymentStatus?.toUpperCase() === "PAID"
    ) {
      return NextResponse.json(
        { ok: false, error: "La orden no esta disponible para pago" },
        { status: 409 }
      );
    }

    const payment = await createMercadoPagoPayment({
      orderId,
      formData,
    });

    return NextResponse.json({
      ok: true,
      orderIds: [orderId],
      payment,
      checkout: {
        redirectUrl:
          payment.status === "approved" ? `/orders/${orderId}/success` : null,
      },
    });
  } catch (error) {
    console.error("Mercado Pago confirm error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "No se pudo confirmar el pago",
      },
      { status: 500 }
    );
  }
}
