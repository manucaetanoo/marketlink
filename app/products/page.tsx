import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";
import ProductsCatalogClient from "@/components/ProductsCatalogClient";
import ProductsHero from "@/components/ProductsHero";
import { getRenderableProductImageUrls } from "@/lib/product-images";


export const metadata: Metadata = {
  title: "Productos - Afilink",
  description: "Explora productos digitales disponibles en Afilink.",
};

export const revalidate = 60;
export const PRODUCTS_PAGE_LIMIT = 40;

async function getActiveProducts() {
  const where = {
      isActive: true,
    };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ commissionValue: "desc" }, { createdAt: "desc" }],
      take: PRODUCTS_PAGE_LIMIT + 1,
      select: {
        id: true,
        name: true,
        desc: true,
        price: true,
        commissionValue: true,
        imageUrls: true,
        _count: {
          select: {
            links: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    total,
    hasMore: products.length > PRODUCTS_PAGE_LIMIT,
    products: products.slice(0, PRODUCTS_PAGE_LIMIT).map((product) => ({
      id: product.id,
      name: product.name,
      desc: product.desc,
      price: product.price,
      commissionValue: product.commissionValue,
      imageUrls: getRenderableProductImageUrls(product.imageUrls, 1),
      affiliateCount: product._count.links,
    })),
  };
}

export default async function ProductsPage() {
  const { products, hasMore, total } = await getActiveProducts();

  return (
    <div className="min-h-screen bg-white text-[#181917]">
      <Navbar />

      <div className="flex min-h-screen pt-15">
        <Sidebar />

        <main className="relative min-w-0 flex-1">
          <div className="mx-auto max-w-[1440px] px-5 pb-12 sm:px-8 lg:px-10">
            <ProductsHero />

            <ProductsCatalogClient
              products={products}
              pageSize={PRODUCTS_PAGE_LIMIT}
              hasMoreInitial={hasMore}
              totalInitial={total}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
