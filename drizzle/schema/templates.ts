import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { networkKeyEnum } from "./enums";

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  networkKey: networkKeyEnum("network_key").notNull().unique(),
  label: text("label").notNull(),
  templateText: text("template_text").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text("updated_by"),
});
