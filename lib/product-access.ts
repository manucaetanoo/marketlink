export const ProductDigitalAccessType = {
  IMMEDIATE: "IMMEDIATE",
  EMAIL_WITHIN_24_BUSINESS_HOURS: "EMAIL_WITHIN_24_BUSINESS_HOURS",
} as const;

export type ProductDigitalAccessType =
  (typeof ProductDigitalAccessType)[keyof typeof ProductDigitalAccessType];

export function normalizeProductDigitalAccessType(
  value: unknown
): ProductDigitalAccessType {
  return value === ProductDigitalAccessType.EMAIL_WITHIN_24_BUSINESS_HOURS
    ? ProductDigitalAccessType.EMAIL_WITHIN_24_BUSINESS_HOURS
    : ProductDigitalAccessType.IMMEDIATE;
}

export function getProductDigitalAccessMessage(value: unknown) {
  const accessType = normalizeProductDigitalAccessType(value);

  if (accessType === ProductDigitalAccessType.EMAIL_WITHIN_24_BUSINESS_HOURS) {
    return "Recibirás las instrucciones de acceso por correo dentro de las 24 horas hábiles posteriores a la confirmación del pago";
  }

  return "Acceso inmediato después de confirmar el pago";
}
