import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { networkKeyEnum } from "./enums";
import { materias } from "./materias";

export const materiaNetworks = pgTable(
  "materia_networks",
  {
    id: serial("id").primaryKey(),
    materiaId: integer("materia_id")
      .notNull()
      .references(() => materias.id, { onDelete: "cascade" }),
    networkKey: networkKeyEnum("network_key").notNull(),
    renderedText: text("rendered_text").notNull(),
    copied: boolean("copied").notNull().default(false),
    copiedAt: timestamp("copied_at", { withTimezone: true }),
    confirmed: boolean("confirmed").notNull().default(false),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedBy: text("confirmed_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_materia_networks_materia_id").on(table.materiaId),
    unique("uq_materia_network").on(table.materiaId, table.networkKey),
  ],
);
