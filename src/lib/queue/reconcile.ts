import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materias } from "@drizzle/schema";
import { enqueueMateriaFire, getMateriaQueue } from "./queue";
import { materiaJobId } from "./jobId";

/**
 * Varredura executada uma vez no boot do servidor: garante que toda matéria
 * ainda pendente tenha um job correspondente no Redis. Cobre o caso de perda
 * de dados do Redis (sem AOF) ou qualquer job perdido — não perde agendamento.
 */
export async function reconcilePendingMaterias(): Promise<void> {
  const pending = await db
    .select({ id: materias.id, scheduledAt: materias.scheduledAt })
    .from(materias)
    .where(
      and(eq(materias.webhookStatus, "pending"), isNull(materias.cancelledAt)),
    );

  let reenqueued = 0;
  for (const m of pending) {
    const existingJob = await getMateriaQueue().getJob(materiaJobId(m.id));
    if (!existingJob) {
      await enqueueMateriaFire(m.id, new Date(m.scheduledAt));
      reenqueued++;
    }
  }

  console.log(
    `[reconciliation] re-enfileiradas ${reenqueued} de ${pending.length} matérias pendentes`,
  );
}
