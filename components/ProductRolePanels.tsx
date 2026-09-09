"use client";

import { useSession } from "next-auth/react";
import { FiLink } from "react-icons/fi";
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
    <section id="affiliate-panel" aria-labelledby="affiliate-title" className="mb-5 scroll-mt-28 rounded-[20px] border border-orange-200 bg-[#fff8f1] p-6">
      <h2 id="affiliate-title" className="text-lg font-semibold tracking-tight text-[#181917]">
        Promocioná este producto
      </h2>
      <p className="mt-4 text-2xl font-bold tracking-tight text-[#181917]">
        Ganás {money(earning)} <span className="text-xs font-medium text-[#62645f]">UYU</span>
      </p>
      <p className="mt-1 text-sm text-[#62645f]">por venta confirmada</p>
      <p className="mt-3 text-sm font-medium text-[#b74300]">Comisión del {commissionValue}%</p>
      <GetAffiliateLinkButton
        productId={productId}
        affiliateId={user.id}
        idleLabel="Generar mi enlace"
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#f96f08] px-4 py-3 text-sm font-semibold text-[#181917] transition hover:bg-[#ff871e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <p className="mt-4 text-xs leading-6 text-[#62645f]">
        Compartilo y ganá una comisión cuando compren desde tu enlace.
      </p>
    </section>
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
