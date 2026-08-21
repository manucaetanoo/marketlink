import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiPackage,
  FiShield,
  FiTag,
  FiDownloadCloud,
} from "react-icons/fi";
import Navbar from "@/components/Navbar";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
import {
  ProductAffiliateJumpButton,
  ProductAffiliatePanel,
  SellerProductNetPanel,
} from "@/components/ProductRolePanels";
import { prisma } from "@/lib/prisma";
import { getSellerNetAmount } from "@/lib/pricing";
import {
  getFirstRenderableProductImage,
  getRenderableProductImageUrls,
} from "@/lib/product-images";
import { unstable_cache } from "next/cache";

function money(value: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const revalidate = 60;
export const dynamic = "force-static";

const getCachedProduct = unstable_cache(
  async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
            storeSlug: true,
            platformCommissionValue: true,
            platformCommissionType: true,
          },
        },
      },
    });

    return product
      ? {
          ...product,
          imageUrls: getRenderableProductImageUrls(product.imageUrls),
        }
      : null;
  },
  ["product-detail"],
  { revalidate: 60, tags: ["products"] }
);

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await getCachedProduct(id);

  if (!product) notFound();

  const sellerNet = getSellerNetAmount({
    price: product.price,
    affiliateCommissionValue: product.commissionValue,
    affiliateCommissionType: product.commissionType,
    platformCommissionValue: product.seller.platformCommissionValue,
    platformCommissionType: product.seller.platformCommissionType,
  });
  const productImage = getFirstRenderableProductImage(product.imageUrls);
  const sellerName = product.seller.name ?? product.seller.storeSlug ?? "Afilink seller";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <main className="pb-16 pt-20">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-600"
            >
              <FiArrowLeft />
              Volver a productos
            </Link>

            <div className="mt-7 max-w-5xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 ring-1 ring-orange-200">
                  <FiTag />
                  Producto digital
                </span>
                {product.isActive && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <FiCheckCircle />
                    Disponible
                  </span>
                )}
                <ProductAffiliateJumpButton sellerId={product.seller.id} />
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {product.name}
              </h1>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                {product.seller.image ? (
                  <div className="h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.seller.image}
                      alt={sellerName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {sellerName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-950">
                    {sellerName}
                  </p>
                  <p className="text-slate-600">Vendedor del producto</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div className="min-w-0 space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4 sm:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      Descripción
                    </h2>
                  </div>

                  <div className="w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm sm:w-24">
                    <div className="aspect-square">
                      <Image
                        src={productImage}
                        alt={product.name}
                        width={256}
                        height={256}
                        priority
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <p className="whitespace-pre-line text-base leading-8 text-slate-700 sm:text-lg">
                  {product.desc ?? "Este producto todavia no tiene descripcion."}
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Tipo
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      Producto digital
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Acceso
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      Instrucciones claras
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Vendedor
                    </p>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-950">
                      {sellerName}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                    <FiDownloadCloud />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-950">
                    Acceso digital
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    El comprador recibe instrucciones cuando el pago queda confirmado.
                  </p>
                </div>
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                    <FiClock />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-950">
                    Activación clara
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Puede ser link, licencia, clave de curso o alta manual.
                  </p>
                </div>
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <FiShield />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-950">
                    Pago protegido
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    La compra se procesa de forma segura y queda registrada en Afilink.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="min-w-0">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
              <div className="border-b border-slate-100 p-5 sm:p-6">
  
                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                  {money(product.price)}
                </p>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">
                    Tipo de entrega
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    Digital
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div id="affiliate-panel" className="scroll-mt-28">
                  <ProductAffiliatePanel
                    productId={product.id}
                    sellerId={product.seller.id}
                    price={product.price}
                    commissionValue={product.commissionValue}
                  />
                </div>

                <SellerProductNetPanel
                  sellerId={product.seller.id}
                  price={product.price}
                  sellerNet={sellerNet}
                />

                <ProductPurchaseActions
                  disabled={!product.isActive}
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: productImage,
                  }}
                />


                <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <FiDownloadCloud className="mt-0.5 shrink-0 text-orange-500" />
                    <span>Producto digital con instrucciones después del pago.</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <FiPackage className="mt-0.5 shrink-0 text-orange-500" />
                    <span>Publicado por {sellerName}.</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <FiInfo className="mt-0.5 shrink-0 text-orange-500" />
                    <span>Si requiere usuario, se habilita con los datos de compra.</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
