-- Drop legacy external commerce integration tables.
DROP TABLE IF EXISTS "ExternalOrderSync";
DROP TABLE IF EXISTS "ShopifyConnection";
DROP TABLE IF EXISTS "WooCommerceConnection";

-- Drop legacy indexes before removing the columns they depend on.
DROP INDEX IF EXISTS "Product_stock_idx";
DROP INDEX IF EXISTS "Product_shopifyShopDomain_idx";
DROP INDEX IF EXISTS "Product_shopifyVariantId_idx";
DROP INDEX IF EXISTS "Product_wooCommerceStoreUrl_idx";
DROP INDEX IF EXISTS "Product_wooCommerceProductId_idx";
DROP INDEX IF EXISTS "Product_wooCommerceVariationId_idx";
DROP INDEX IF EXISTS "Order_shopifyShopDomain_idx";
DROP INDEX IF EXISTS "Order_shopifyOrderId_idx";
DROP INDEX IF EXISTS "Order_shopifyShopDomain_shopifyOrderId_key";

-- Product is now digital-only and manually managed in Afilink.
ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "stock",
  DROP COLUMN IF EXISTS "category",
  DROP COLUMN IF EXISTS "sizes",
  DROP COLUMN IF EXISTS "colors",
  DROP COLUMN IF EXISTS "shopifyShopDomain",
  DROP COLUMN IF EXISTS "shopifyProductId",
  DROP COLUMN IF EXISTS "shopifyVariantId",
  DROP COLUMN IF EXISTS "shopifyVariants",
  DROP COLUMN IF EXISTS "wooCommerceStoreUrl",
  DROP COLUMN IF EXISTS "wooCommerceProductId",
  DROP COLUMN IF EXISTS "wooCommerceVariationId",
  DROP COLUMN IF EXISTS "wooCommerceVariants";

ALTER TABLE "Order"
  DROP COLUMN IF EXISTS "shopifyShopDomain",
  DROP COLUMN IF EXISTS "shopifyOrderId",
  DROP COLUMN IF EXISTS "shopifyOrderName";

DROP TYPE IF EXISTS "ProductCategory";
