import { pgEnum } from "drizzle-orm/pg-core";

export const networkKeyEnum = pgEnum("network_key", [
  "twitter_x",
  "youtube",
  "facebook",
  "gettr",
]);

export const webhookStatusEnum = pgEnum("webhook_status", [
  "pending",
  "success",
  "failed",
]);
