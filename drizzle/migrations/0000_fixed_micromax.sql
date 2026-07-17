CREATE TYPE "public"."network_key" AS ENUM('gettr', 'youtube_comunidade_1', 'youtube_comunidade_2', 'twitter_x', 'facebook');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "materias" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"subtitulo" text NOT NULL,
	"link" text NOT NULL,
	"image_data" "bytea",
	"image_mime_type" varchar(50),
	"image_size_bytes" integer,
	"scheduled_at" timestamp with time zone NOT NULL,
	"webhook_status" "webhook_status" DEFAULT 'pending' NOT NULL,
	"webhook_attempts" integer DEFAULT 0 NOT NULL,
	"webhook_last_error" text,
	"fired_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materia_networks" (
	"id" serial PRIMARY KEY NOT NULL,
	"materia_id" integer NOT NULL,
	"network_key" "network_key" NOT NULL,
	"rendered_text" text NOT NULL,
	"copied" boolean DEFAULT false NOT NULL,
	"copied_at" timestamp with time zone,
	"confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_materia_network" UNIQUE("materia_id","network_key")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"network_key" "network_key" NOT NULL,
	"label" text NOT NULL,
	"template_text" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "templates_network_key_unique" UNIQUE("network_key")
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"materia_id" integer,
	"network_key" "network_key",
	"actor" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "materia_networks" ADD CONSTRAINT "materia_networks_materia_id_materias_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_materia_id_materias_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_materias_scheduled_at" ON "materias" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_materias_webhook_status" ON "materias" USING btree ("webhook_status");--> statement-breakpoint
CREATE INDEX "idx_materia_networks_materia_id" ON "materia_networks" USING btree ("materia_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_created_at" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_log_materia_id" ON "activity_log" USING btree ("materia_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_network_key" ON "activity_log" USING btree ("network_key");--> statement-breakpoint
CREATE INDEX "idx_activity_log_event_type" ON "activity_log" USING btree ("event_type");