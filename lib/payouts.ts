import {
  CommissionStatus,
  FulfillmentStatus,
  PayoutMethod,
  PayoutRequestKind,
  PayoutRequestStatus,
  Role,
  SettlementStatus,
} from "@/lib/prisma-enums";
import {
  type Prisma,
  type User,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PayoutUser = Pick<
  User,
  | "payoutMethod"
  | "payoutHolderName"
  | "payoutDocumentType"
  | "payoutDocumentNumber"
  | "payoutEmail"
  | "payoutPhone"
  | "payoutCountry"
  | "payoutCurrency"
  | "bankName"
  | "bankAccountType"
  | "bankAccountNumber"
  | "bankAccountAlias"
>;

function filled(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function getMissingPayoutFields(user: PayoutUser) {
  const missing: string[] = [];
  const method = user.payoutMethod ?? PayoutMethod.BANK_TRANSFER;

  if (!filled(user.payoutHolderName)) missing.push("titular");
  if (!filled(user.payoutDocumentType)) missing.push("tipo de documento");
  if (!filled(user.payoutDocumentNumber)) missing.push("numero de documento");
  if (!filled(user.payoutCountry)) missing.push("pais");
  if (!filled(user.payoutCurrency)) missing.push("moneda");

  if (method === PayoutMethod.BANK_TRANSFER) {
    if (!filled(user.bankName)) missing.push("banco");
    if (!filled(user.bankAccountType)) missing.push("tipo de cuenta");
    if (!filled(user.bankAccountNumber) && !filled(user.bankAccountAlias)) {
      missing.push("numero de cuenta o alias");
    }
  }

  if (method === PayoutMethod.DLOCAL_GO || method === PayoutMethod.MANUAL) {
    if (!filled(user.payoutEmail) && !filled(user.payoutPhone)) {
      missing.push("email o telefono de cobro");
    }
  }

  return missing;
}

export async function getAvailablePayoutAmount(
  userId: string,
  kind: PayoutRequestKind
) {
  return (await getPayoutSnapshot(prisma, userId, kind)).amount;
}

export async function getPayoutSnapshot(db: Prisma.TransactionClient, userId: string, kind: PayoutRequestKind) {
  const pending = await db.payoutRequest.findMany({
    where: { requesterId: userId, kind, status: PayoutRequestStatus.PENDING },
    select: { commissionIds: true, settlementIds: true },
  });
  // An old request has no reliable allocation. An admin must reconcile/cancel it first.
  if (pending.some(request => !request.commissionIds.length && !request.settlementIds.length)) {
    return { amount: 0, commissionIds: [] as string[], settlementIds: [] as string[] };
  }
  if (kind === PayoutRequestKind.SELLER) {
    const settlements = await db.settlement.findMany({
      where: { sellerId: userId, status: SettlementStatus.AVAILABLE, fulfillmentStatus: FulfillmentStatus.DELIVERED,
        id: { notIn: pending.flatMap(request => request.settlementIds) }, order: { status: "PAID" } },
      select: { id: true, netAmount: true },
    });
    return { amount: settlements.reduce((sum, row) => sum + row.netAmount, 0), settlementIds: settlements.map(row => row.id), commissionIds: [] as string[] };
  }
  const commissions = await db.commission.findMany({
    where: { affiliateId: userId, status: CommissionStatus.APPROVED, order: { status: "PAID" },
      id: { notIn: pending.flatMap(request => request.commissionIds) } },
    select: { id: true, amount: true },
  });
  return { amount: commissions.reduce((sum, row) => sum + row.amount, 0), commissionIds: commissions.map(row => row.id), settlementIds: [] as string[] };
}

export function getPayoutKindForRole(role: Role) {
  if (role === Role.SELLER) return PayoutRequestKind.SELLER;
  if (role === Role.AFFILIATE) return PayoutRequestKind.AFFILIATE;
  return null;
}

export async function hasPendingPayoutRequest(
  userId: string,
  kind: PayoutRequestKind
) {
  const existing = await prisma.payoutRequest.findFirst({
    where: {
      requesterId: userId,
      kind,
      status: PayoutRequestStatus.PENDING,
    },
    select: {
      id: true,
    },
  });

  return Boolean(existing);
}
