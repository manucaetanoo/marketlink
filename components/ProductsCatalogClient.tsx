"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FiArrowRight,
  FiLink,
  FiPackage,
  FiShoppingBag,
} from "react-icons/fi";
import ProductCard, { type ProductCardProduct } from "@/components/ProductCard";

type Props = {
  products: ProductCardProduct[];
  pageSize: number;
  hasMoreInitial: boolean;
  totalInitial: number;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const getCommissionEarning = (price: number, commissionValue: number) => {
  return Math.round((price * commissionValue) / 100);
};

function AudiencePanel({
  role,
  totalItems,
  topCommission,
  topEarning,
}: {
  role?: string | null;
  totalItems: number;
  topCommission: number;
  topEarning: number;
}) {
  const normalizedRole = String(role ?? "").toUpperCase();
  const isAffiliate = normalizedRole === "AFFILIATE";
  const isSeller = normalizedRole === "SELLER";
  const isAdmin = normalizedRole === "ADMIN";

  if (isAffiliate) {
    return (
      <section className="mt-2 overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-5 sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
              <FiLink />
              Afiliados
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Elegi productos por oportunidad de comision.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              En esta vista la comision y la ganancia estimada tienen prioridad,
              porque tu trabajo es comparar que conviene promocionar.
            </p>
          </div>

          <div className="grid grid-cols-2 border-t border-orange-100 bg-orange-50/70 lg:border-l lg:border-t-0">
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                Mayor comision
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {topCommission}%
              </p>
            </div>
            <div className="border-l border-orange-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                Ganas hasta
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {formatMoney(topEarning)}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isSeller || isAdmin) {
    return (
      <section className="mt-2 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            <FiPackage />
            Vista de catalogo
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Mira como ven tus productos compradores y afiliados.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Este marketplace muestra productos activos. Para crear, editar o
            ajustar comisiones, usa tu panel de vendedor.
          </p>
        </div>
        <Link
          href="/seller/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Gestionar productos
          <FiArrowRight />
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
        <FiShoppingBag />
        Marketplace
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
        Explora productos digitales listos para comprar.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Entrá al producto, revisá los detalles y continuá la compra desde el checkout.
      </p>
      <div className="mt-5 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
        {totalItems} {totalItems === 1 ? "producto disponible" : "productos disponibles"}
      </div>
    </section>
  );
}

function AffiliateSignupPanel() {
  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="p-5 sm:p-6">
          <p className="text-sm font-semibold text-orange-700">
            ¿Queres ganar comision?
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Registrate como afiliado para generar tus propios links y ganar por las
            ventas que lleguen desde tus recomendaciones.
          </p>
        </div>
        <div className="border-t border-orange-100 bg-orange-50/70 p-5 lg:border-l lg:border-t-0">
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 lg:w-auto"
          >
            Crear cuenta de afiliado
            <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ProductsCatalogClient({
  products,
  pageSize,
  hasMoreInitial,
  totalInitial,
}: Props) {
  const { data } = useSession();
  const [items, setItems] = useState(products);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [totalItems, setTotalItems] = useState(totalInitial);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);
  const role = data?.user?.role;
  const isVisitor = !role;
  const showAffiliateHighlights = role === "AFFILIATE";
  const isSellerCatalogView = role === "SELLER" || role === "ADMIN";
  const showCommissionBadge = showAffiliateHighlights || isSellerCatalogView;
  const topCommission = items.length
    ? Math.max(...items.map((product) => Number(product.commissionValue || 0)))
    : 0;
  const topEarning = items.length
    ? Math.max(
        ...items.map((product) =>
          getCommissionEarning(
            Number(product.price || 0),
            Number(product.commissionValue || 0)
          )
        )
      )
    : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  async function fetchProducts(page = 1) {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      take: String(pageSize),
    });
    const res = await fetch(`/api/products?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !Array.isArray(data?.products)) return null;

    return {
      products: data.products as ProductCardProduct[],
      hasMore: Boolean(data.hasMore),
      total: Number(data.total ?? 0),
    };
  }

  async function goToPage(page: number) {
    if (page < 1 || page > totalPages || page === currentPage || loadingPage) return;

    setLoadingPage(true);

    try {
      const result = await fetchProducts(page);
      if (!result) return;

      setItems(result.products);
      setHasMore(result.hasMore);
      setTotalItems(result.total);
      setCurrentPage(page);
    } finally {
      setLoadingPage(false);
    }
  }

  return (
    <>
      <div className="border-t border-[#e3e5df] pt-6">
        <p className="text-sm text-[#62645f]">
          {totalItems} {totalItems === 1 ? "producto disponible" : "productos disponibles"}
        </p>
      </div>
      {items.length === 0 ? (
        <section className="mt-10 rounded-[28px] border border-dashed border-orange-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              *
            </div>
            <h3 className="text-xl font-semibold text-slate-900">
              No hay productos publicados
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Cuando haya productos activos, los vas a ver aca con una vista mucho mas
              orientada a venta y promocion.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section aria-labelledby="products-heading" className="mt-10">
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>

            <div
              className={`grid grid-cols-1 gap-x-6 gap-y-5 transition-opacity sm:grid-cols-2 sm:gap-y-10 xl:grid-cols-3 xl:gap-x-8 2xl:grid-cols-4 ${
                loadingPage ? "opacity-50" : "opacity-100"
              }`}
            >
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showAffiliateHighlights={showAffiliateHighlights}
                  showCommissionBadge={showCommissionBadge}
                  primaryActionLabel={
                    role === "AFFILIATE"
                      ? "Promocionar"
                      : isSellerCatalogView
                        ? "Ver detalle"
                        : "Comprar"
                  }
                />
              ))}
            </div>

            {totalItems > pageSize && (
              <div className="mt-10 flex flex-col items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm sm:flex-row">
                <p className="text-sm text-slate-500">
                  Pagina {currentPage} de {totalPages} · {totalItems} productos
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || loadingPage}
                    className="rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>

                  <span className="rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={!hasMore || currentPage >= totalPages || loadingPage}
                    className="rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="mt-10">
            <AudiencePanel
              role={role}
              totalItems={totalItems}
              topCommission={topCommission}
              topEarning={topEarning}
            />
          </div>

          {isVisitor && <AffiliateSignupPanel />}
        </>
      )}
    </>
  );
}
