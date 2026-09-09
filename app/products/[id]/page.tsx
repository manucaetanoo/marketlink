import Link from "next/link";
import Image from "next/image";
import { DM_Sans, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, CreditCardIcon } from "@heroicons/react/24/solid";
import Navbar from "@/components/Navbar";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
import { ProductAffiliateJumpButton, ProductAffiliatePanel, SellerProductNetPanel } from "@/components/ProductRolePanels";
import { prisma } from "@/lib/prisma";
import { getSellerNetAmount } from "@/lib/pricing";
import { getFirstRenderableProductImage, getRenderableProductImageUrls } from "@/lib/product-images";
import { getProductDigitalAccessMessage } from "@/lib/product-access";
import { unstable_cache } from "next/cache";
import s from "./product.module.css";

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--detail-body" });
const headingFont = Manrope({ subsets: ["latin"], variable: "--detail-heading" });
const money = (value: number) => new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 }).format(value);

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
  const sellerName = product.seller.name || product.seller.storeSlug || "Vendedor de Afilink";
  const accessMessage = getProductDigitalAccessMessage(product.digitalAccessType);
  const total = product.price;
  const description = product.desc?.trim();
  const firstParagraph = description?.split(/\n\s*\n/)[0] ?? "";
  const summary = firstParagraph.length > 190
    ? `${firstParagraph.slice(0, 187).replace(/\s+\S*$/, "")}…`
    : firstParagraph;

  return (
    <div className={`${bodyFont.variable} ${headingFont.variable}`}>
      <Navbar />
      <main className={s.page}>
        <div className={s.wrap}>
          <Link href="/products" className={s.back}><ArrowLeftIcon aria-hidden="true" />Volver al catálogo</Link>
          <div className={s.layout}>
            <header className={s.header}>
              <div className={s.headerActions}>
                <p className={s.eyebrow}><span />PRODUCTO DIGITAL</p>
                <ProductAffiliateJumpButton sellerId={product.seller.id} />
              </div>
              <h1>{product.name}</h1>
              {summary && <p className={s.summary}>{summary}</p>}
              <div className={s.seller}>
                {product.seller.image ? <Image src={product.seller.image} alt="" width={40} height={40} unoptimized className={s.avatar} /> : <span className={s.avatar} aria-hidden="true">{sellerName.slice(0, 1).toUpperCase()}</span>}
                <p>Publicado por <strong>{sellerName}</strong></p>
              </div>
            </header>

            <div className={s.visual}>
              <Image src={productImage} alt={product.name} width={800} height={640} priority unoptimized className={s.productImage} />
            </div>

            <aside className={s.purchase} aria-label="Precio y compra">
              <ProductAffiliatePanel productId={product.id} sellerId={product.seller.id} price={product.price} commissionValue={product.commissionValue} />
              <div className={s.purchaseCard} id="comprar">
                <p className={s.eyebrow}>{product.isActive ? "TU PRÓXIMO PASO" : "PRODUCTO NO DISPONIBLE"}</p>
                <p className={s.price}>{money(total)} <span>UYU</span></p>
                <p className={s.priceNote}>Pesos uruguayos</p>
                <ProductPurchaseActions disabled={!product.isActive} product={{ id: product.id, name: product.name, price: product.price, imageUrl: productImage }} />
                <p className={s.paymentNote}>Revisá tus datos y elegí cómo pagar en el siguiente paso.</p>
                <div className={s.purchaseFacts}>
                  <div><ClockIcon aria-hidden="true" /><p>{accessMessage}.</p></div>
                  <div><CreditCardIcon aria-hidden="true" /><p>Pago procesado por <strong>Mercado Pago</strong>.</p></div>
                </div>
                <Link href="/contacto" className={s.helpLink}>¿Tenés una consulta antes de comprar?<ArrowRightIcon aria-hidden="true" /></Link>
              </div>
              <div className={s.rolePanels}>
                <SellerProductNetPanel sellerId={product.seller.id} price={product.price} sellerNet={sellerNet} />
              </div>
            </aside>

            <div className={s.details}>
              <section aria-labelledby="about-product">
                <p className={s.eyebrow}>CONOCÉ EL PRODUCTO</p>
                <h2 id="about-product">Qué vas a encontrar</h2>
                {description ? <p className={s.description}>{description}</p> : <p className={s.description}>Consultanos por el contenido de este producto antes de comprar. <Link href="/contacto">Hacer una consulta</Link></p>}
              </section>
              <section className={s.beforeBuying} aria-labelledby="before-buying">
                <h2 id="before-buying">Antes de comprar</h2>
                <details open><summary>¿Cuándo recibo el acceso?</summary><p>{accessMessage}. Usá un correo al que tengas acceso al completar la compra.</p></details>
                <details><summary>¿Cómo realizo el pago?</summary><p>Al seleccionar “Comprar ahora” vas al checkout de Afilink. Ahí completás tus datos y elegís entre los medios de pago disponibles en Mercado Pago.</p></details>
                <details><summary>¿Dónde consulto las condiciones de compra?</summary><p>Podés leer los <Link href="/terms">términos y condiciones</Link> o <Link href="/contacto">contactarnos</Link> si necesitás aclarar algo antes de pagar.</p></details>
              </section>
            </div>
          </div>
        </div>
        <div className={s.mobilePurchase}>
          <div><span>Total en UYU</span><strong>{money(total)}</strong></div>
          {product.isActive ? <a href="#comprar">Ir a comprar<ArrowRightIcon aria-hidden="true" /></a> : <span>No disponible</span>}
        </div>
      </main>
    </div>
  );
}
