import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materias } from "@drizzle/schema";
import { insertActivityLog } from "@/lib/activity/log";

export interface SendWebhookResult {
  alreadyDone: boolean;
  success: boolean;
  error?: string;
}

/**
 * Faz uma única tentativa de envio do webhook do n8n para uma matéria.
 *
 * Em caso de sucesso, já persiste webhook_status='success' + fired_at e
 * registra o evento de atividade — comportamento igual para fila e reenvio manual.
 *
 * Em caso de falha, NÃO decide sozinha se o status final é 'failed': apenas
 * retorna o erro. Quem chama decide (o processor da fila re-tenta via BullMQ
 * até esgotar as tentativas; a rota de reenvio manual marca 'failed' na hora
 * por ser uma tentativa única).
 */
export async function sendWebhookOnce(
  materiaId: number,
  options?: { logEventOnSuccess?: "webhook_fired" | "webhook_resent"; actor?: string },
): Promise<SendWebhookResult> {
  const [materia] = await db
    .select()
    .from(materias)
    .where(eq(materias.id, materiaId))
    .limit(1);

  if (!materia || materia.cancelledAt) {
    return { alreadyDone: true, success: false, error: "Matéria cancelada ou inexistente." };
  }
  if (materia.webhookStatus === "success") {
    return { alreadyDone: true, success: true };
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const baseUrl = process.env.PUBLIC_BASE_URL;
  if (!webhookUrl || !baseUrl) {
    throw new Error("N8N_WEBHOOK_URL ou PUBLIC_BASE_URL não definidas");
  }

  const payload = {
    materiaId: materia.id,
    titulo: materia.titulo,
    subtitulo: materia.subtitulo,
    link: materia.link,
    imageUrl: `${baseUrl}/api/images/${materia.id}`,
    scheduledAt: materia.scheduledAt.toISOString(),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let success = false;
  let errorMessage: string | undefined;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.ok) {
      success = true;
    } else {
      errorMessage = `Webhook respondeu com status ${res.status}`;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
  } finally {
    clearTimeout(timeout);
  }

  if (success) {
    await db
      .update(materias)
      .set({
        webhookStatus: "success",
        firedAt: new Date(),
        webhookLastError: null,
        updatedAt: new Date(),
      })
      .where(eq(materias.id, materiaId));

    await insertActivityLog(db, {
      eventType: options?.logEventOnSuccess ?? "webhook_fired",
      actor: options?.actor ?? "sistema",
      materiaId,
    });
  }

  return { alreadyDone: false, success, error: errorMessage };
}

/** Incrementa webhookAttempts e grava o último erro, sem mudar o status. */
export async function recordWebhookAttemptFailure(
  materiaId: number,
  currentAttempts: number,
  errorMessage: string | undefined,
): Promise<void> {
  await db
    .update(materias)
    .set({
      webhookAttempts: currentAttempts + 1,
      webhookLastError: errorMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(materias.id, materiaId));
}

/** Marca definitivamente como falho (todas as tentativas esgotadas, ou reenvio manual). */
export async function markWebhookFailed(
  materiaId: number,
  errorMessage: string | undefined,
  actor: string,
): Promise<void> {
  await db
    .update(materias)
    .set({ webhookStatus: "failed", webhookLastError: errorMessage ?? null, updatedAt: new Date() })
    .where(eq(materias.id, materiaId));

  await insertActivityLog(db, {
    eventType: "webhook_failed",
    actor,
    materiaId,
    metadata: { error: errorMessage },
  });
}
