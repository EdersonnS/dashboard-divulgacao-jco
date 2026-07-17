import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { FIRE_MATERIA_JOB_NAME, MATERIA_QUEUE_NAME, materiaJobId } from "./jobId";

declare global {
  var __ddMateriaQueue: Queue | undefined;
}

/**
 * Criada sob demanda (não no import do módulo): o construtor do Queue do
 * BullMQ já tenta falar com o Redis, o que quebraria o `next build` — a etapa
 * de "collect page data" importa toda rota, mesmo sem executá-la de fato.
 */
export function getMateriaQueue(): Queue {
  if (!globalThis.__ddMateriaQueue) {
    globalThis.__ddMateriaQueue = new Queue(MATERIA_QUEUE_NAME, {
      connection: redisConnection,
    });
  }
  return globalThis.__ddMateriaQueue;
}

export interface FireMateriaJobData {
  materiaId: number;
}

export async function enqueueMateriaFire(
  materiaId: number,
  scheduledAt: Date,
): Promise<void> {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());
  await getMateriaQueue().add(
    FIRE_MATERIA_JOB_NAME,
    { materiaId } satisfies FireMateriaJobData,
    {
      jobId: materiaJobId(materiaId),
      delay,
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 500,
    },
  );
}

export async function removeMateriaJob(materiaId: number): Promise<void> {
  await getMateriaQueue().remove(materiaJobId(materiaId));
}
