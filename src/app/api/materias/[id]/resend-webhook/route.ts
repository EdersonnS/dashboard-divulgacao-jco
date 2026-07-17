import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materias } from "@drizzle/schema";
import { getSessionUser } from "@/lib/auth/session";
import { markWebhookFailed, sendWebhookOnce } from "@/lib/webhook/send";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const [materia] = await db
    .select()
    .from(materias)
    .where(eq(materias.id, id))
    .limit(1);

  if (!materia) {
    return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
  }
  if (materia.webhookStatus !== "failed") {
    return NextResponse.json(
      { error: "Reenvio só é permitido quando o webhook falhou." },
      { status: 409 },
    );
  }

  const session = await getSessionUser();
  const actor = session?.username ?? "desconhecido";

  const result = await sendWebhookOnce(id, {
    logEventOnSuccess: "webhook_resent",
    actor,
  });

  if (!result.success && !result.alreadyDone) {
    await markWebhookFailed(id, result.error, actor);
  }

  return NextResponse.json(result);
}
