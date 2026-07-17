import { Worker, type Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materias } from "@drizzle/schema";
import {
  markWebhookFailed,
  recordWebhookAttemptFailure,
  sendWebhookOnce,
} from "@/lib/webhook/send";
import { redisConnection } from "./connection";
import { FIRE_MATERIA_JOB_NAME, MATERIA_QUEUE_NAME } from "./jobId";
import type { FireMateriaJobData } from "./queue";

async function processFireMateria(job: Job<FireMateriaJobData>) {
  const { materiaId } = job.data;

  const result = await sendWebhookOnce(materiaId);
  if (result.alreadyDone || result.success) {
    return;
  }

  const [materia] = await db
    .select({ webhookAttempts: materias.webhookAttempts })
    .from(materias)
    .where(eq(materias.id, materiaId))
    .limit(1);

  await recordWebhookAttemptFailure(
    materiaId,
    materia?.webhookAttempts ?? 0,
    result.error,
  );

  const maxAttempts = job.opts.attempts ?? 1;
  const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

  if (isFinalAttempt) {
    await markWebhookFailed(materiaId, result.error, "sistema");
    return;
  }

  throw new Error(result.error ?? "Falha ao enviar webhook, tentando novamente.");
}

let worker: Worker<FireMateriaJobData> | undefined;

export function startMateriaWorker(): Worker<FireMateriaJobData> {
  if (worker) return worker;

  worker = new Worker<FireMateriaJobData>(
    MATERIA_QUEUE_NAME,
    async (job) => {
      if (job.name === FIRE_MATERIA_JOB_NAME) {
        await processFireMateria(job);
      }
    },
    { connection: redisConnection, concurrency: 5 },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] job ${job?.id} (matéria ${job?.data.materiaId}) falhou: ${err.message}`,
    );
  });

  return worker;
}
