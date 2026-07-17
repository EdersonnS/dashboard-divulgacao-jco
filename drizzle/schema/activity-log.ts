import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { materias } from "./materias";

export const activityLog = pgTable(
  "activity_log",
  {
    id: serial("id").primaryKey(),
    eventType: text("event_type").notNull(),
    materiaId: integer("materia_id").references(() => materias.id, {
      onDelete: "cascade",
    }),
    // text, e não o enum: o histórico é imutável e precisa continuar guardando
    // eventos de redes que já saíram do ar (ex: as comunidades do YouTube).
    networkKey: text("network_key"),
    actor: text("actor").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_activity_log_created_at").on(table.createdAt),
    index("idx_activity_log_materia_id").on(table.materiaId),
    index("idx_activity_log_network_key").on(table.networkKey),
    index("idx_activity_log_event_type").on(table.eventType),
  ],
);
