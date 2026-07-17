import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { templates } from "@drizzle/schema";
import { getSessionUser } from "@/lib/auth/session";
import { insertActivityLog } from "@/lib/activity/log";
import { networkKeySchema, templateUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ networkKey: string }> },
) {
  const { networkKey: rawKey } = await params;
  const keyParsed = networkKeySchema.safeParse(rawKey);
  if (!keyParsed.success) {
    return NextResponse.json({ error: "Rede inválida." }, { status: 400 });
  }
  const networkKey = keyParsed.data;

  const body = await request.json().catch(() => null);
  const parsed = templateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const session = await getSessionUser();
  const actor = session?.username ?? "desconhecido";

  const [updated] = await db
    .update(templates)
    .set({
      ...(parsed.data.label ? { label: parsed.data.label } : {}),
      templateText: parsed.data.templateText,
      updatedAt: new Date(),
      updatedBy: actor,
    })
    .where(eq(templates.networkKey, networkKey))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Template não encontrado." },
      { status: 404 },
    );
  }

  await insertActivityLog(db, {
    eventType: "template_updated",
    actor,
    networkKey,
  });

  return NextResponse.json(updated);
}
