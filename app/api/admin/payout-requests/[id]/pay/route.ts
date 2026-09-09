import { NextResponse } from "next/server";
import { requireRole, requireUser } from "@/lib/auth";
import { financialTransaction } from "@/lib/financial-transaction";
import { completePayout } from "@/lib/complete-payout";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    requireRole(user, ["ADMIN"]);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const notes = typeof body.adminNotes === "string" ? body.adminNotes.trim().slice(0, 1000) || null : null;
    const request = await financialTransaction(tx => completePayout(tx, id, notes, body.action === "cancel"));
    return NextResponse.json({ ok: true, request });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el cobro";
    return NextResponse.json({ ok: false, error: message }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400 });
  }
}
