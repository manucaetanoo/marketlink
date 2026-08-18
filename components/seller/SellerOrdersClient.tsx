"use client";
import {
  FiPackage,
  FiUser,
} from "react-icons/fi";

type FulfillmentStatus =
  | "PENDING"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERY_REQUESTED"
  | "DELIVERED"
  | "CANCELED";

type SettlementStatus = "PENDING" | "AVAILABLE" | "PAID" | "CANCELED";

export type SellerOrder = {
  id: string;
  grossAmount: number;
  platformFee: number;
  affiliateFee: number;
  netAmount: number;
  status: SettlementStatus;
  fulfillmentStatus: FulfillmentStatus;
  sellerNotes: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  seller?: {
    name: string | null;
    email: string | null;
    storeSlug?: string | null;
  };
  order: {
    id: string;
    status: string;
    buyerName: string | null;
    buyerEmail: string | null;
    buyerPhone: string | null;
    shippingNotes: string | null;
    items: Array<{
      id: string;
      quantity: number;
      selectedSize: string | null;
      selectedColor: string | null;
      total: number;
      product: {
        name: string;
      };
    }>;
  };
};

function money(value: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: FulfillmentStatus) {
  const labels: Record<FulfillmentStatus, string> = {
    CANCELED: "Cancelado",
    DELIVERY_REQUESTED: "Acceso por revisar",
    DELIVERED: "Acceso habilitado",
    PENDING: "Pendiente",
    PREPARING: "Preparando acceso",
    SHIPPED: "Acceso enviado",
  };

  return labels[status];
}

function settlementLabel(status: SettlementStatus) {
  const labels: Record<SettlementStatus, string> = {
    AVAILABLE: "Disponible",
    CANCELED: "Cancelada",
    PAID: "Liquidada",
    PENDING: "Retenida",
  };

  return labels[status];
}

function statusClasses(status: FulfillmentStatus | SettlementStatus) {
  if (status === "DELIVERED" || status === "AVAILABLE" || status === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "DELIVERY_REQUESTED") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (status === "SHIPPED" || status === "PREPARING") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "CANCELED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function fulfillmentPriority(status: FulfillmentStatus) {
  const priorities: Record<FulfillmentStatus, number> = {
    PENDING: 0,
    PREPARING: 1,
    SHIPPED: 2,
    DELIVERY_REQUESTED: 3,
    DELIVERED: 4,
    CANCELED: 5,
  };

  return priorities[status];
}

export default function SellerOrdersClient({
  orders,
  canConfirmDelivery = false,
  showActiveSection = true,
  showPaidSection = true,
}: {
  orders: SellerOrder[];
  canConfirmDelivery?: boolean;
  showActiveSection?: boolean;
  showPaidSection?: boolean;
}) {
  const activeOrders = orders
    .filter((order) => order.status !== "PAID")
    .toSorted((first, second) => {
      const priorityDiff =
        fulfillmentPriority(first.fulfillmentStatus) -
        fulfillmentPriority(second.fulfillmentStatus);

      if (priorityDiff !== 0) return priorityDiff;

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  const paidOrders = orders.filter((order) => order.status === "PAID");

  function renderOrderCard(settlement: SellerOrder) {
          return (
            <article
              key={settlement.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
            >
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses(
                      settlement.fulfillmentStatus
                    )}`}
                  >
                    {statusLabel(settlement.fulfillmentStatus)}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses(
                      settlement.status
                    )}`}
                  >
                    {settlementLabel(settlement.status)}
                  </span>
                </div>

                <h2 className="mt-3 truncate text-lg font-semibold text-slate-950">
                  Venta digital {settlement.order.id.slice(-8)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pagada el {formatDate(settlement.createdAt)}
                </p>
                {canConfirmDelivery && settlement.seller && (
                  <p className="mt-1 text-sm text-slate-500">
                    Empresa:{" "}
                    {settlement.seller.name ??
                      settlement.seller.storeSlug ??
                      settlement.seller.email ??
                      "Sin nombre"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 xl:min-w-[520px]">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Bruto</p>
                  <p className="mt-1 font-semibold">{money(settlement.grossAmount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Plataforma</p>
                  <p className="mt-1 font-semibold">{money(settlement.platformFee)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Afiliado</p>
                  <p className="mt-1 font-semibold">{money(settlement.affiliateFee)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">A liquidar</p>
                  <p className="mt-1 font-semibold text-emerald-800">
                    {money(settlement.netAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-3">
              <div className="space-y-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FiPackage />
                    Productos
                  </h3>
                  <div className="mt-3 space-y-2">
                    {settlement.order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 text-slate-700">
                          <span className="block truncate">{item.product.name}</span>
                          {item.selectedSize && (
                            <span className="mt-0.5 block text-xs font-semibold text-orange-700">
                              Talle {item.selectedSize}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-semibold">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Comprador
                  </h3>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>{settlement.order.buyerName ?? "Sin nombre"}</p>
                    <p>{settlement.order.buyerEmail ?? "Sin email"}</p>
                    <p>{settlement.order.buyerPhone ?? "Sin telefono"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FiUser />
                    Datos de acceso
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Usa el email o telefono del comprador para enviar licencia, archivo, acceso o instrucciones del producto digital.
                  </p>
                  {settlement.order.shippingNotes && (
                    <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                      {settlement.order.shippingNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  <p>Venta: {formatDate(settlement.createdAt)}</p>
                  <p>Acceso: {formatDate(settlement.deliveredAt)}</p>
                </div>
              </div>
            </div>
          </article>
          );
  }

  return (
    <div className="space-y-8">
      {orders.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Todavia no hay ventas digitales pagas para gestionar.
        </div>
      ) : (
        <>
          {showActiveSection && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Ventas por liquidar
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ventas digitales pendientes de liquidacion.
                </p>
              </div>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                {activeOrders.length}
              </span>
            </div>

            {activeOrders.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                No hay ventas pendientes de gestion.
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((settlement) => renderOrderCard(settlement))}
              </div>
            )}
          </section>
          )}

          {showPaidSection && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Ventas ya liquidadas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Historial de ventas cuyo pago ya fue liquidado.
                </p>
              </div>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                {paidOrders.length}
              </span>
            </div>

            {paidOrders.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                Todavia no hay ventas liquidadas.
              </div>
            ) : (
              <div className="space-y-4">
                {paidOrders.map((settlement) => renderOrderCard(settlement))}
              </div>
            )}
          </section>
          )}
        </>
      )}
    </div>
  );
}
