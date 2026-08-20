import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { normalizeProductImageUrls } from "@/lib/product-images";

const productCategories = [
  "DIGITAL",
] as const;

const categoriesWithSizes = new Set<string>();

function normalizeSizes(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((size): size is string => typeof size === "string")
        .map((size) => size.trim().toUpperCase())
        .filter(Boolean)
    )
  ).slice(0, 20);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ERROR";
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    requireRole(user, ["SELLER", "ADMIN"]);

    const { id } = await params;
    const body = await req.json();

    const data: {
      name?: string;
      desc?: string | null;
      digitalAccessInstructions?: string | null;
      price?: number;
      isActive?: boolean;
      category?: (typeof productCategories)[number];
      sizes?: string[];
      colors?: [];
      commissionValue?: number;
      commissionType?: "PERCENT";
      imageUrls?: string[];
    } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();

      if (name.length < 3) {
        return NextResponse.json(
          { ok: false, error: "Nombre muy corto" },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (body.desc !== undefined) data.desc = String(body.desc).trim() || null;

    if (body.digitalAccessInstructions !== undefined) {
      data.digitalAccessInstructions =
        String(body.digitalAccessInstructions).trim() || null;
    }

    if (body.price !== undefined) {
      const price = Number(body.price);

      if (!Number.isInteger(price) || price <= 0) {
        return NextResponse.json(
          { ok: false, error: "Precio invalido" },
          { status: 400 }
        );
      }

      data.price = price;
    }

    if (body.category !== undefined) {
      const category = String(body.category).trim().toUpperCase();

      if (!productCategories.includes(category as (typeof productCategories)[number])) {
        return NextResponse.json(
          { ok: false, error: "Solo se pueden publicar productos digitales" },
          { status: 400 }
        );
      }

      data.category = category as (typeof productCategories)[number];
      data.sizes = categoriesWithSizes.has(category)
        ? normalizeSizes(body.sizes)
        : [];
    } else if (body.sizes !== undefined) {
      data.sizes = [];
    }

    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    data.colors = [];

    if (body.commissionValue !== undefined) {
      const commissionValue = Number(body.commissionValue);

      if (!Number.isInteger(commissionValue) || commissionValue <= 0 || commissionValue > 100) {
        return NextResponse.json(
          { ok: false, error: "Comision invalida" },
          { status: 400 }
        );
      }

      data.commissionValue = commissionValue;
      data.commissionType = "PERCENT";
    }

    if (body.commissionType !== undefined) {
      const commissionType = String(body.commissionType).trim().toUpperCase();

      if (commissionType !== "PERCENT") {
        return NextResponse.json(
          { ok: false, error: "La comision debe ser por porcentaje" },
          { status: 400 }
        );
      }

      data.commissionType = "PERCENT";
    }

    if (body.imageUrls !== undefined) {
      data.imageUrls = normalizeProductImageUrls(body.imageUrls).slice(0, 1);
    }

    const where = user.role === "ADMIN" ? { id } : { id, sellerId: user.id };

    const updated = await prisma.product.update({
      where,
      data,
      select: {
        id: true,
        name: true,
        desc: true,
        digitalAccessInstructions: true,
        price: true,
        category: true,
        sizes: true,
        colors: true,
        isActive: true,
        commissionValue: true,
        commissionType: true,
        sellerId: true,
        imageUrls: true,
        updatedAt: true,
      },
    });

    revalidateTag("products", "max");
    revalidateTag("campaigns", "max");
    revalidateTag("stores", "max");
    revalidatePath("/products");
    revalidatePath(`/products/${updated.id}`);

    return NextResponse.json({ ok: true, product: updated });
  } catch (e: unknown) {
    const msg = getErrorMessage(e);
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "Debes tener rol de vendedor" ? 403 : 400;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    requireRole(user, ["SELLER", "ADMIN"]);

    const { id } = await params;
    const where = user.role === "ADMIN" ? { id } : { id, sellerId: user.id };

    const product = await prisma.product.findFirst({
      where,
      select: {
        id: true,
        _count: {
          select: {
            orders: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    if (product._count.orders > 0 || product._count.orderItems > 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se puede eliminar un producto con ordenes registradas. Desactivalo para ocultarlo sin perder el historial.",
        },
        { status: 409 }
      );
    }

    await prisma.product.delete({
      where: { id: product.id },
    });

    revalidateTag("products", "max");
    revalidateTag("campaigns", "max");
    revalidateTag("stores", "max");
    revalidatePath("/products");
    revalidatePath(`/products/${product.id}`);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = getErrorMessage(e);
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 400;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
