import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materias, materiaNetworks } from "@drizzle/schema";
import { getSessionUser } from "@/lib/auth/session";
import { insertActivityLog } from "@/lib/activity/log";

/**
 * Confirma a divulgação de uma matéria em um passo só: marca todos os destinos
 * ainda pendentes como divulgados. Com isso a matéria passa a "divulgada" e sai
 * do foco da home — a tela de execução dá lugar à próxima divulgação.
 */
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
    .select({ id: materias.id, cancelledAt: materias.cancelledAt })
    .from(materias)
    .where(eq(materias.id, id))
    .limit(1);

  if (!materia) {
    return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
  }
  if (materia.cancelledAt) {
    return NextResponse.json(
      { error: "Matéria cancelada não pode ser divulgada." },
      { status: 409 },
    );
  }

  const session = await getSessionUser();
  const actor = session?.username ?? "desconhecido";
  const now = new Date();

  const confirmed = await db
    .update(materiaNetworks)
    .set({ confirmed: true, confirmedAt: now, confirmedBy: actor })
    .where(
      and(
        eq(materiaNetworks.materiaId, id),
        eq(materiaNetworks.confirmed, false),
      ),
    )
    .returning({ networkKey: materiaNetworks.networkKey });

  await insertActivityLog(db, {
    eventType: "materia_divulgada",
    actor,
    materiaId: id,
    metadata: { destinos: confirmed.map((n) => n.networkKey) },
  });

  return NextResponse.json({ ok: true, confirmados: confirmed.length });
}
