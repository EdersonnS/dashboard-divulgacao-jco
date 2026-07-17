declare global {
  var __ddWorkerStarted: boolean | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (globalThis.__ddWorkerStarted) return;
  globalThis.__ddWorkerStarted = true;

  try {
    const { startMateriaWorker } = await import("@/lib/queue/worker");
    const { reconcilePendingMaterias } = await import("@/lib/queue/reconcile");

    startMateriaWorker();
    console.log("[instrumentation] worker BullMQ iniciado.");

    await reconcilePendingMaterias();
  } catch (err) {
    // Uma falha aqui (Redis/DB fora do ar no boot) não deve derrubar o Next.js.
    console.error("[instrumentation] falha ao iniciar worker/reconciliação:", err);
  }
}
