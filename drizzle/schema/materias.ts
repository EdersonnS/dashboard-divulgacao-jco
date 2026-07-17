import {
  customType,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { webhookStatusEnum } from "./enums";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const materias = pgTable(
  "materias",
  {
    id: serial("id").primaryKey(),
    titulo: text("titulo").notNull(),
    subtitulo: text("subtitulo").notNull(),
    link: text("link").notNull(),
    imageData: bytea("image_data"),
    imageMimeType: varchar("image_mime_type", { length: 50 }),
    imageSizeBytes: integer("image_size_bytes"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    webhookStatus: webhookStatusEnum("webhook_status")
      .notNull()
      .default("pending"),
    webhookAttempts: integer("webhook_attempts").notNull().default(0),
    webhookLastError: text("webhook_last_error"),
    firedAt: timestamp("fired_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_materias_scheduled_at").on(table.scheduledAt),
    index("idx_materias_webhook_status").on(table.webhookStatus),
  ],
);
