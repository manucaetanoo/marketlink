import Link from "next/link";
import Image from "next/image";

export type ProductCardProduct = {
  id: string;
  name: string;
  desc: string | null;
  price: number;
  stock: number;
  commissionValue: number;
  imageUrls: string[];
};

type ProductCardProps = {
  product: ProductCardProduct;
  showAffiliateHighlights?: boolean;
  showCommissionBadge?: boolean;
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const getCommissionLabel = (product: ProductCardProduct) => {
  return `${product.commissionValue}%`;
};

const getCommissionEarning = (product: ProductCardProduct) => {
  return Math.round((product.price * product.commissionValue) / 100);
};

export default function ProductCard({
  product,
  showAffiliateHighlights = false,
  showCommissionBadge = showAffiliateHighlights,
}: ProductCardProps) {
  const imageUrl = product.imageUrls?.[0] ?? null;
  const isInlineImage = imageUrl?.startsWith("data:") ?? false;
  const isRemoteProductImage = /^https?:\/\//i.test(imageUrl ?? "");
  const hasCommission =
    showCommissionBadge &&
    typeof product.commissionValue === "number" &&
    product.commissionValue > 0;
  const hasAffiliateCommission =
    showAffiliateHighlights &&
    typeof product.commissionValue === "number" &&
    product.commissionValue > 0;

  const commissionLabel = getCommissionLabel(product);
  const commissionEarning = getCommissionEarning(product);

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_45px_-30px_rgba(15,23,42,0.55)]">
      <Link
        href={`/products/${product.id}`}
        className="relative block overflow-hidden"
      >
        {hasCommission && (
          <div className="absolute left-3 top-3 z-10 rounded-xl bg-orange-500 px-3 py-2 text-white shadow-lg shadow-orange-500/30">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-100">
              Comision
            </p>
            <p className="mt-0.5 text-xl font-black leading-none">
              {commissionLabel}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-white/85">
              por venta
            </p>
          </div>
        )}

        <div className="relative aspect-[4/2.75] w-full overflow-hidden bg-slate-100">
          {imageUrl && (isInlineImage || isRemoteProductImage) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name || "Producto"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name || "Producto"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 via-white to-amber-50 text-sm font-medium text-slate-500">
              Sin imagen
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight text-slate-900 transition group-hover:text-orange-700 sm:text-base">
            {product.name}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500 sm:text-sm">
          {product.desc ?? "Este producto no tiene descripcion todavia."}
        </p>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="font-semibold text-slate-500">Precio del producto</span>
            <span className="font-bold text-slate-900">{formatPrice(product.price)}</span>
          </div>

          {hasAffiliateCommission && (
            <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500">
                  Ganancia estimada
                </span>
                <span className="text-base font-black text-emerald-600 sm:text-lg">
                  {formatPrice(commissionEarning)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2 sm:mt-5 sm:gap-3">
          <Link
            href={`/products/${product.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Ver producto
          </Link>

          <Link
            href={`/products/${product.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            Comprar
          </Link>
        </div>
      </div>
    </article>
  );
}
