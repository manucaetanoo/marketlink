import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, ReceiptText, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getProductDigitalAccessMessage } from "@/lib/product-access";

type OrderStatus = "PENDING" | "PAID" | "CANCELED";

const orderLabels: Record<OrderStatus, string> = {
  CANCELED: "Compra cancelada",
  PAID: "Pago confirmado",
  PENDING: "Pago pendiente",
};

function formatDate(value: Date | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      buyerName: true,
      buyerEmail: true,
      buyerPhone: true,
      shippingNotes: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          quantity: true,
          total: true,
          product: {
            select: {
              name: true,
              digitalAccessInstructions: true,
              digitalAccessType: true,
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const status = order.status as OrderStatus;
  const isPaid = status === "PAID";
  const isCanceled = status === "CANCELED";
  const StatusIcon = isCanceled ? XCircle : isPaid ? CheckCircle2 : Clock3;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
              Recibo digital
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              Compra #{order.id.slice(-8)}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Realizada el {formatDate(order.createdAt)}.
            </p>
          </div>

          <div
            className={`rounded-xl border bg-white px-4 py-3 shadow-sm ${
              isCanceled ? "border-rose-200" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <StatusIcon
                className={`h-5 w-5 ${
                  isCanceled
                    ? "text-rose-600"
                    : isPaid
                      ? "text-emerald-600"
                      : "text-orange-600"
                }`}
              />
              <div>
                <p className="text-xs font-medium text-slate-500">Estado</p>
                <p
                  className={`mt-1 font-semibold ${
                    isCanceled ? "text-rose-700" : "text-slate-950"
                  }`}
                >
                  {orderLabels[status]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isCanceled && (
          <section className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <h2 className="font-semibold">Esta compra fue cancelada</h2>
            <p className="mt-2 text-sm leading-6">
              Si tenés dudas sobre el pago, contactá al soporte con el número
              completo de la compra.
            </p>
          </section>
        )}

        {!isCanceled && !isPaid && (
          <section className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-5 text-orange-950">
            <h2 className="font-semibold">El pago todavía no está confirmado</h2>
            <p className="mt-2 text-sm leading-6">
              Las instrucciones de acceso se muestran cuando la compra queda
              aprobada.
            </p>
          </section>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Productos</h2>
              <span className="text-sm font-semibold text-slate-700">
                {money(order.total)}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-950">
                        {item.product.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                      {money(item.total)}
                    </p>
                  </div>

                  <div className="mt-3 rounded-lg border border-orange-100 bg-white p-3 text-sm leading-6">
                    <p className="font-semibold text-orange-800">
                      {getProductDigitalAccessMessage(
                        item.product.digitalAccessType
                      )}
                      .
                    </p>

                    {isPaid && item.product.digitalAccessInstructions && (
                      <p className="mt-2 whitespace-pre-line text-slate-700">
                        {item.product.digitalAccessInstructions}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total de la compra
                  </p>
                  <p className="text-xl font-semibold">{money(order.total)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Datos de contacto</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Comprador</dt>
                  <dd className="mt-1 text-slate-900">
                    {order.buyerName ?? "Sin nombre"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Email</dt>
                  <dd className="mt-1 break-words text-slate-900">
                    {order.buyerEmail ?? "Sin email"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Teléfono</dt>
                  <dd className="mt-1 text-slate-900">
                    {order.buyerPhone ?? "Sin teléfono"}
                  </dd>
                </div>
                {order.shippingNotes && (
                  <div>
                    <dt className="font-medium text-slate-500">Indicaciones</dt>
                    <dd className="mt-1 leading-6 text-slate-900">
                      {order.shippingNotes}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          </aside>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/pedido"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Consultar otra compra
          </Link>
          <Link
            href="/products"
            className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
