"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@prisma/client";
import { getRenderableProductImageUrls } from "@/lib/product-images";

export default function ProductGallery({ product }: { product: Product }) {
  const productImages = getRenderableProductImageUrls(product.imageUrls);
  const images = productImages.length ? productImages : ["/placeholder.png"];
  const [mainImage, setMainImage] = useState(images[0]);

  return (
    <div className="w-full">
      <div className="grid gap-3 sm:grid-cols-[56px_1fr]">
        <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setMainImage(url)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-slate-100 transition ${
                mainImage === url
                  ? "border-orange-500 ring-2 ring-orange-100"
                  : "border-slate-200 hover:border-orange-300"
              }`}
            >
              <Image
                src={url}
                alt={`${product.name} ${index + 1}`}
                width={56}
                height={56}
                unoptimized
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        <div className="order-1 overflow-hidden rounded-2xl bg-slate-100 sm:order-2">
          <div className="aspect-square w-full">
            <Image
              src={mainImage}
              alt={product.name}
              width={640}
              height={640}
              priority
              unoptimized
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
