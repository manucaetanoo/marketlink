"use client";

import { useSession } from "next-auth/react";
import { FiDollarSign, FiLink, FiPercent } from "react-icons/fi";
import GetAffiliateLinkButton from "@/components/GetAffiliateLinkButton";

type SellerNet = {
  netAmount: number;
  affiliateAmount: number;
  platformAmount: number;
};

type Props = {
  productId: string;
  sellerId: string;
  price: number;
  commissionValue: number;
  sellerNet: SellerNet;
};

function money(value: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function SellerProductNetPanel({
  sellerId,
  price,
  sellerNet,
}: Pick<Props, "sellerId" | "price" | "sellerNet">) {
  const { data } = useSession();
  const user = data?.user;

  if (user?.role !== "SELLER" || user.id !== sellerId) return null;

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-sm font-semibold text-emerald-900">
        Ganancia neta: {money(sellerNet.netAmount)}
      </p>
      <div className="mt-3 grid gap-3 text-sm text-emerald-950 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Afiliado
          </p>
          <p className="mt-1 font-semibold">-{money(sellerNet.affiliateAmount)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Plataforma
          </p>
          <p className="mt-1 font-semibold">-{money(sellerNet.platformAmount)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Precio
          </p>
          <p className="mt-1 font-semibold">{money(price)}</p>
        </div>
      </div>
    </div>
  );
}

export function ProductAffiliatePanel({
  productId,
  sellerId,
  price,
  commissionValue,
}: Pick<Props, "productId" | "sellerId" | "price" | "commissionValue">) {
  const { data } = useSession();
  const user = data?.user;

  if (user?.role !== "AFFILIATE" || !user.id || user.id === sellerId) return null;

  const earning = Math.round((price * commissionValue) / 100);

  return (
    <div className="mt-5 rounded-2xl border border-orange-200 bg-[#fff8f1] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
        Oportunidad para afiliados
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        Podés ganar {money(earning)}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Compartí tu link. Si la compra entra por ese link, la comisión queda
        registrada para vos.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-orange-100 bg-white p-3">
          <FiDollarSign className="text-orange-500" />
          <p className="mt-2 text-xs font-medium text-slate-500">Ganancia</p>
          <p className="text-base font-semibold text-slate-950">{money(earning)}</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-3">
          <FiPercent className="text-orange-500" />
          <p className="mt-2 text-xs font-medium text-slate-500">Comisión</p>
          <p className="text-base font-semibold text-slate-950">{commissionValue}%</p>
        </div>
      </div>

      <GetAffiliateLinkButton
        productId={productId}
        affiliateId={user.id}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

export function ProductAffiliateJumpButton({
  sellerId,
}: Pick<Props, "sellerId">) {
  const { data } = useSession();
  const user = data?.user;

  if (user?.role !== "AFFILIATE" || !user.id || user.id === sellerId) return null;

  return (
    <a
      href="#affiliate-panel"
      className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
    >
      <FiLink  />
      Promocionar producto
    </a>
  );
}
