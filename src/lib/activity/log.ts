import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@drizzle/schema";
import { activityLog } from "@drizzle/schema";
import type { NetworkKey } from "@/lib/constants";

export type EventType =
  | "materia_created"
  | "materia_edited"
  | "materia_cancelled"
  | "materia_divulgada"
  | "network_copied"
  | "network_confirmed"
  | "network_unconfirmed"
  | "webhook_fired"
  | "webhook_failed"
  | "webhook_resent"
  | "template_updated";

export async function insertActivityLog(
  dbOrTx: NodePgDatabase<typeof schema>,
  entry: {
    eventType: EventType;
    actor: string;
    materiaId?: number;
    networkKey?: NetworkKey;
    metadata?: Record<string, unknown>;
  },
) {
  await dbOrTx.insert(activityLog).values({
    eventType: entry.eventType,
    actor: entry.actor,
    materiaId: entry.materiaId ?? null,
    networkKey: entry.networkKey ?? null,
    metadata: entry.metadata ?? null,
  });
}
