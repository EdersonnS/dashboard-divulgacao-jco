import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materiaNetworks } from "@drizzle/schema";
import { getSessionUser } from "@/lib/auth/session";
import { insertActivityLog } from "@/lib/activity/log";
import { networkActionSchema, networkKeySchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; networkKey: string }> },
) {
  const { id: idParam, networkKey: rawKey } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const keyParsed = networkKeySchema.safeParse(rawKey);
  if (!keyParsed.success) {
    return NextResponse.json({ error: "Rede inválida." }, { status: 400 });
  }
  const networkKey = keyParsed.data;

  const body = await request.json().catch(() => null);
  const parsed = networkActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const session = await getSessionUser();
  const actor = session?.username ?? "desconhecido";
  const now = new Date();

  // Copiar apenas registra que o texto foi copiado — NÃO conclui a divulgação.
  // A confirmação é um passo explícito (checkbox do destino ou o botão grande
  // "Confirmar divulgação"), para o texto poder ser copiado sem tirar a matéria
  // da tela de execução antes de o usuário realmente ter publicado.
  const values =
    parsed.data.action === "copy"
      ? { copied: true, copiedAt: now }
      : parsed.data.action === "confirm"
        ? { confirmed: true, confirmedAt: now, confirmedBy: actor }
        : { confirmed: false, confirmedAt: null, confirmedBy: null };

  const [updated] = await db
    .update(materiaNetworks)
    .set(values)
    .where(
      and(
        eq(materiaNetworks.materiaId, id),
        eq(materiaNetworks.networkKey, networkKey),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Rede não encontrada para esta matéria." },
      { status: 404 },
    );
  }

  if (parsed.data.action === "copy") {
    await insertActivityLog(db, {
      eventType: "network_copied",
      actor,
      materiaId: id,
      networkKey,
    });
  } else {
    await insertActivityLog(db, {
      eventType:
        parsed.data.action === "confirm"
          ? "network_confirmed"
          : "network_unconfirmed",
      actor,
      materiaId: id,
      networkKey,
    });
  }

  return NextResponse.json(updated);
}
