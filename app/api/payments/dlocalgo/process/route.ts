import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await req.text().catch(() => "");

  return NextResponse.json(
    {
      ok: false,
      error: "dLocal Go fue reemplazado por /api/payments/mercadopago/process",
    },
    { status: 410 }
  );
}
