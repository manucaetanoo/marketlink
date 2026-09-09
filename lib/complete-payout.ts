import { type Prisma } from "@prisma/client";

export async function completePayout(tx: Prisma.TransactionClient, id: string, adminNotes: string | null, cancel = false) {
  const request = await tx.payoutRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Solicitud no encontrada");
  if (request.status !== "PENDING") throw new Error("La solicitud ya fue procesada");
  if (!cancel) {
    const seller = request.kind === "SELLER";
    const ids = seller ? request.settlementIds : request.commissionIds;
    if (!ids.length) throw new Error("Solicitud antigua sin detalle de comisiones. Revisá si ya se transfirió antes de cancelarla y pedir un nuevo cobro.");
    const where = seller
      ? { id: { in: ids }, sellerId: request.requesterId, status: "AVAILABLE" as const, fulfillmentStatus: "DELIVERED" as const, order: { status: "PAID" as const } }
      : { id: { in: ids }, affiliateId: request.requesterId, status: "APPROVED" as const, order: { status: "PAID" as const } };
    const rows = seller
      ? (await tx.settlement.findMany({ where: where as Prisma.SettlementWhereInput, select: { id: true, netAmount: true } })).map(row => ({ id: row.id, amount: row.netAmount }))
      : await tx.commission.findMany({ where: where as Prisma.CommissionWhereInput, select: { id: true, amount: true } });
    if (rows.length !== ids.length || rows.reduce((sum, row) => sum + row.amount, 0) !== request.amount) {
      throw new Error("El saldo de esta solicitud cambió (por ejemplo, una devolución). Revisala antes de transferir; podés cancelarla para recalcular el cobro.");
    }
    const updated = seller
      ? await tx.settlement.updateMany({ where: where as Prisma.SettlementWhereInput, data: { status: "PAID" } })
      : await tx.commission.updateMany({ where: where as Prisma.CommissionWhereInput, data: { status: "PAID" } });
    if (updated.count !== ids.length) throw new Error("El saldo cambió. Volvé a revisar la solicitud.");
  }
  return tx.payoutRequest.update({ where: { id }, data: {
    status: cancel ? "CANCELED" : "PAID", paidAt: cancel ? null : new Date(), adminNotes,
  }, select: { id: true, status: true, paidAt: true } });
}
