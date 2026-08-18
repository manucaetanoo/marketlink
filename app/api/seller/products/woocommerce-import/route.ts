import { NextResponse } from "next/server";
import { requireRole, requireUser } from "@/lib/auth";

export async function POST() {
  const user = await requireUser();
  requireRole(user, ["SELLER", "ADMIN"]);

  return NextResponse.json(
    {
      ok: false,
      error:
        "Las importaciones fisicas estan deshabilitadas. Publica productos digitales manualmente.",
    },
    { status: 410 }
  );
}
