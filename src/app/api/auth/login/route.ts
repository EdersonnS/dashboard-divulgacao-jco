import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@drizzle/schema";
import { verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Usuário e senha são obrigatórios." },
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Usuário ou senha inválidos." },
      { status: 401 },
    );
  }

  const token = await signSession({ sub: String(user.id), username: user.username });

  const response = NextResponse.json({ ok: true, username: user.username });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}
