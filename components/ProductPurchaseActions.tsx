"use client";

import { useSearchParams } from "next/navigation";
import { BuyButton } from "@/components/BuyButton";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
  };
  refCode?: string | null;
  disabled?: boolean;
};

export default function ProductPurchaseActions({
  product,
  refCode,
  disabled = false,
}: Props) {
  const searchParams = useSearchParams();
  const resolvedRefCode = refCode ?? searchParams.get("ref");
  const disabledReason = disabled ? "No disponible" : undefined;

  return (
    <div className="mt-7">
      <BuyButton
        productId={product.id}
        refCode={resolvedRefCode}
        selectedSize={null}
        selectedColor={null}
        disabled={disabled}
        disabledReason={disabledReason}
      />
    </div>
  );
}
