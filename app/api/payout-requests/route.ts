import { financialTransaction } from "@/lib/financial-transaction";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PayoutRequestStatus } from "@/lib/prisma-enums";
import {
  getPayoutSnapshot,
  getMissingPayoutFields,
  getPayoutKindForRole,
} from "@/lib/payouts";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ERROR";
}

export async function POST() {
  try {
    const authUser = await requireUser();
    const kind = getPayoutKindForRole(authUser.role);

    if (!kind) {
      return NextResponse.json(
        { ok: false, error: "Tu rol no puede solicitar liquidaciones" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        payoutMethod: true,
        payoutHolderName: true,
        payoutDocumentType: true,
        payoutDocumentNumber: true,
        payoutEmail: true,
        payoutPhone: true,
        payoutCountry: true,
        payoutCurrency: true,
        bankName: true,
        bankAccountType: true,
        bankAccountNumber: true,
        bankAccountAlias: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const missing = getMissingPayoutFields(user);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Completa tus datos de cobro: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const request = await financialTransaction(async tx => {
      const snapshot = await getPayoutSnapshot(tx, authUser.id, kind);
      if (snapshot.amount <= 0) throw new Error("No tenés saldo disponible. Revisá tus cobros en proceso.");
      return tx.payoutRequest.create({
        data: { requesterId: authUser.id, kind, ...snapshot, status: PayoutRequestStatus.PENDING },
        select: { id: true, amount: true, kind: true, status: true },
      });
    });

    return NextResponse.json({ ok: true, request }, { status: 201 });
  } catch (e: unknown) {
    const msg = getErrorMessage(e);
    const status = msg === "UNAUTHORIZED" ? 401 : 400;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
