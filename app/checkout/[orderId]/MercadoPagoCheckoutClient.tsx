"use client";

import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Script from "next/script";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ShippingData = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingApartment: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingNotes: string;
};

type OrderCheckoutData = {
  id: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  status: string;
  paymentStatus: string | null;
  shipping: ShippingData;
  items: Array<{
    id: string;
    total: number;
    selectedSize: string | null;
    selectedColor: string | null;
    product: {
      name: string;
      desc: string | null;
      imageUrls: string[];
    };
  }>;
};

type Props = {
  order: OrderCheckoutData;
  publicKey: string;
  sdkUrl: string;
  draftItems?: Array<{
    productId: string;
    quantity?: number;
    selectedSize?: string | null;
    selectedColor?: string | null;
    clickId?: string;
    campaignClickId?: string;
  }>;
};

type MercadoPagoBrickController = {
  unmount: () => void;
};

type MercadoPagoSdk = {
  bricks: () => {
    create: (
      type: "payment",
      containerId: string,
      settings: Record<string, unknown>
    ) => Promise<MercadoPagoBrickController>;
  };
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: Record<string, unknown>) => MercadoPagoSdk;
  }
}

const requiredShippingFields: Array<keyof ShippingData> = [
  "buyerName",
  "buyerEmail",
  "buyerPhone",
];

const ALLOWED_SHIPPING_COUNTRY = "UY";
const paymentBrickContainerId = "paymentBrick_container";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

function getStatusMessage(status: string | null) {
  switch (status) {
    case "approved":
      return "Pago aprobado. Ya registramos tu compra.";
    case "pending":
    case "in_process":
      return "Tu pago esta pendiente de confirmacion.";
    case "rejected":
      return "Mercado Pago rechazo el pago. Proba con otro medio.";
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "El pago fue cancelado o devuelto.";
    default:
      return null;
  }
}

export default function MercadoPagoCheckoutClient({
  order,
  publicKey,
  sdkUrl,
  draftItems,
}: Props) {
  const brickControllerRef = useRef<MercadoPagoBrickController | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brickReady, setBrickReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessConfirmed, setAccessConfirmed] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState(order.id);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(
    order.paymentStatus
  );
  const [shipping, setShipping] = useState<ShippingData>(order.shipping);

  const resetBrickSession = (accessConfirmedValue = false) => {
    brickControllerRef.current?.unmount();
    brickControllerRef.current = null;
    setPreferenceId(null);
    setBrickReady(false);
    setAccessConfirmed(accessConfirmedValue);
  };

  useEffect(() => {
    if (!sdkReady || !preferenceId || !window.MercadoPago) return;

    let alive = true;

    const mountBrick = async () => {
      try {
        const MercadoPago = window.MercadoPago;

        if (!MercadoPago) {
          setError("No se pudo cargar Mercado Pago");
          return;
        }

        brickControllerRef.current?.unmount();

        const mp = new MercadoPago(publicKey, { locale: "es-UY" });
        const bricksBuilder = mp.bricks();
        const controller = await bricksBuilder.create(
          "payment",
          paymentBrickContainerId,
          {
            initialization: {
              amount: Number(order.total),
              preferenceId,
              payer: {
                email: shipping.buyerEmail,
              },
            },
            customization: {
              paymentMethods: {
                creditCard: "all",
                debitCard: "all",
                prepaidCard: "all",
                ticket: "all",
                mercadoPago: "all",
              },
            },
            callbacks: {
              onReady: () => {
                if (alive) {
                  setBrickReady(true);
                  setError(null);
                }
              },
              onSubmit: ({ formData }: { formData: Record<string, unknown> }) =>
                new Promise<void>((resolve, reject) => {
                  fetch("/api/payments/mercadopago/confirm", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      orderId: paymentOrderId,
                      formData,
                    }),
                  })
                    .then((response) =>
                      response.json().then((data) => ({ response, data }))
                    )
                    .then(({ response, data }) => {
                      if (!response.ok || !data.ok) {
                        throw new Error(
                          data.error ?? "No se pudo confirmar el pago"
                        );
                      }

                      const status = String(data.payment?.status ?? "pending");
                      setPaymentStatus(status);

                      if (data.checkout?.redirectUrl) {
                        window.location.href = String(data.checkout.redirectUrl);
                      }

                      resolve();
                    })
                    .catch((err) => {
                      const message =
                        err instanceof Error
                          ? err.message
                          : "No se pudo procesar el pago";
                      setError(message);
                      reject(err);
                    });
                }),
              onError: (err: unknown) => {
                setError(
                  err instanceof Error
                    ? err.message
                    : "No se pudo cargar Mercado Pago"
                );
              },
            },
          }
        );

        if (!alive) {
          controller.unmount();
          return;
        }

        brickControllerRef.current = controller;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo iniciar Mercado Pago"
        );
      }
    };

    void mountBrick();

    return () => {
      alive = false;
      brickControllerRef.current?.unmount();
      brickControllerRef.current = null;
    };
  }, [preferenceId, publicKey, sdkReady, order.total, paymentOrderId, shipping.buyerEmail]);

  const statusMessage = getStatusMessage(paymentStatus);

  const setShippingField = (field: keyof ShippingData, value: string) => {
    setShipping((current) => ({ ...current, [field]: value }));
    resetBrickSession(false);
  };

  const validateShipping = () => {
    const missingField = requiredShippingFields.find(
      (field) => !shipping[field].trim()
    );

    if (missingField) return "Completa tus datos para recibir el acceso antes de pagar.";
    if (!/^\S+@\S+\.\S+$/.test(shipping.buyerEmail.trim())) {
      return "Ingresa un email valido para recibir la confirmacion.";
    }

    return null;
  };

  const createPaymentSession = async () => {
    const shippingError = validateShipping();

    if (shippingError) {
      setError(shippingError);
      return;
    }

    setLoading(true);
    setError(null);
    resetBrickSession(false);

    try {
      const response = await fetch("/api/payments/mercadopago/process", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: paymentOrderId === "pendiente" ? undefined : paymentOrderId,
          items: draftItems,
          shippingData: {
            ...shipping,
            shippingCountry: ALLOWED_SHIPPING_COUNTRY,
            shippingStreet: "",
            shippingNumber: "",
            shippingApartment: "",
            shippingCity: "",
            shippingState: "",
            shippingPostalCode: "",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo iniciar el pago con Mercado Pago");
      }

      const resolvedOrderId = String(data.orderIds?.[0] ?? paymentOrderId);
      const resolvedPreferenceId = data.checkout?.preferenceId;

      if (!resolvedPreferenceId) {
        throw new Error("Mercado Pago no devolvio la preferencia para Bricks");
      }

      setPaymentOrderId(resolvedOrderId);
      setPaymentStatus(String(data.payment?.status ?? "pending"));
      setPreferenceId(String(resolvedPreferenceId));
      setAccessConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src={sdkUrl} strategy="afterInteractive" onLoad={() => setSdkReady(true)} />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                  <PackageCheck className="h-3.5 w-3.5" />
                  Orden #{paymentOrderId}
                </p>
                <h1 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
                  Finaliza tu compra
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Pago seguro con Mercado Pago y datos protegidos durante todo el proceso.
                </p>
              </div>

              <div className="grid w-full grid-cols-3 gap-2 rounded-2xl border border-white/80 bg-white/80 p-2 shadow-sm backdrop-blur md:w-auto md:min-w-80">
                <StepBadge active completed={accessConfirmed} icon={<UserRound className="h-4 w-4" />} label="Datos" />
                <StepBadge active={accessConfirmed} completed={paymentStatus === "approved"} icon={<CreditCard className="h-4 w-4" />} label="Pago" />
                <StepBadge active={paymentStatus === "approved"} completed={paymentStatus === "approved"} icon={<ShieldCheck className="h-4 w-4" />} label="Listo" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
          <section className="min-w-0 space-y-5">
            <div className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
              <SectionTitle
                icon={<UserRound className="h-5 w-5" />}
                title="Datos para recibir el acceso"
                description="La empresa usara estos datos para enviarte el producto digital."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField label="Nombre completo" value={shipping.buyerName} onChange={(value) => setShippingField("buyerName", value)} autoComplete="name" />
                <TextField label="Email" value={shipping.buyerEmail} onChange={(value) => setShippingField("buyerEmail", value)} type="email" autoComplete="email" />
                <TextField label="Telefono" value={shipping.buyerPhone} onChange={(value) => setShippingField("buyerPhone", value.replace(/\D/g, "").slice(0, 9).replace(/(\d{3})(\d{3})(\d{0,3})/, (_match, g1, g2, g3) => (g3 ? `${g1} ${g2} ${g3}` : `${g1} ${g2}`)))} type="tel" autoComplete="tel" />
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                  Indicaciones para el vendedor
                  <textarea
                    value={shipping.shippingNotes}
                    onChange={(event) => setShippingField("shippingNotes", event.target.value)}
                    className={`${inputClassName} min-h-24 resize-none`}
                    placeholder="Ej: email alternativo, usuario de la cuenta, datos para activar la licencia."
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={createPaymentSession}
                disabled={loading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <UserRound className="h-4 w-4" />
                {loading && !accessConfirmed ? "Preparando pago..." : "Continuar al pago"}
              </button>
            </div>

            <div className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
              {!accessConfirmed ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>Completa y confirma tus datos para habilitar el pago.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <SectionTitle
                    icon={<CreditCard className="h-5 w-5" />}
                    title="Pago"
                    description="Selecciona el medio de pago y completa los datos en Mercado Pago."
                  />
                  <div
                    id={paymentBrickContainerId}
                    className="min-h-72 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 sm:p-2"
                  />
                  {!brickReady && (
                    <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
                      <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>Cargando Mercado Pago...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Resumen</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                  <div className="rounded-full bg-orange-100 p-2 text-orange-700">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product.imageUrls[0] ?? "https://readymadeui.com/images/product14.webp"}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-slate-950">
                        {item.product.name}
                      </p>
                      {item.product.desc && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {item.product.desc}
                        </p>
                      )}
                      {item.selectedSize && (
                        <p className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                          Talle {item.selectedSize}
                        </p>
                      )}
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        ${Number(item.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5">
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-700">
                      ${Number(order.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recargo</span>
                    <span className="font-medium text-slate-700">
                      ${Number(order.taxAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">
                    ${Number(order.total).toFixed(2)}
                  </span>
                </div>
                <p className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Pago procesado de forma segura
                </p>
              </div>
            </div>

            {statusMessage && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {loading && (
              <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Procesando pago con Mercado Pago...</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-orange-100 p-2.5 text-orange-700">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function StepBadge({
  active,
  completed,
  icon,
  label,
}: {
  active: boolean;
  completed: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div
      className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-xs font-semibold transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {completed ? <CheckCircle2 className="h-4 w-4" /> : icon}
      <span>{label}</span>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
        type={type}
        autoComplete={autoComplete}
      />
    </label>
  );
}
