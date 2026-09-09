import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/prisma-enums";
import { sendEmailVerification } from "@/lib/email-verification";
import { rateLimit } from "@/lib/rate-limit";


export async function POST(req: Request) {
  const limit = rateLimit(req, {
    key: "auth:register",
    limit: 10,
    windowMs: 60_000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await req.json();

  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const name = body.name ? String(body.name).trim() : null;
  const requestedRole = body.role ? String(body.role).toUpperCase() : Role.AFFILIATE;

  if (requestedRole !== Role.AFFILIATE) {
    return NextResponse.json(
      {
        error:
          "Por ahora las cuentas de empresa se solicitan por mail desde el formulario de contacto.",
      },
      { status: 403 }
    );
  }

  const role = Role.AFFILIATE;


  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son obligatorios" },
      { status: 400 }
    );
  }


  if (password.length < 6) {
    return NextResponse.json(
      { error: "Contraseña muy corta (mínimo 6)" },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerifiedAt: true,
    },
  });
  if (exists) {
    if (!exists.emailVerifiedAt) {
      await sendEmailVerification({ req, user: exists });
      return NextResponse.json({
        message: "La cuenta ya existia. Te reenviamos el email de verificacion.",
        created: false,
        email: exists.email,
        role: exists.role,
      });
    }

    return NextResponse.json({ error: "Ese email ya existe" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      isActive: true,
      emailVerifiedAt: null,
    },
    select: { id: true, email: true, name:true, role: true, isActive: true },
  });

  await sendEmailVerification({ req, user });

  return NextResponse.json(
    {
      message: "Cuenta creada. Te enviamos un email para verificar tu cuenta.",
      created: true,
      email: user.email,
      role: user.role,
    },
    { status: 201 }
  );
}
