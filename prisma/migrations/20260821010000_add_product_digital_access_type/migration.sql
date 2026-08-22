CREATE TYPE "ProductDigitalAccessType" AS ENUM (
  'IMMEDIATE',
  'EMAIL_WITHIN_24_BUSINESS_HOURS'
);

ALTER TABLE "Product"
ADD COLUMN "digitalAccessType" "ProductDigitalAccessType" NOT NULL DEFAULT 'IMMEDIATE';
