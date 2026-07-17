-- Consolida os destinos de 5 para 4: Twitter, YouTube, Canal do Facebook, Gettr.
-- As duas comunidades do YouTube viram um único destino "youtube".
--
-- Postgres não remove valor de enum, então o caminho é: soltar as colunas para
-- text, consolidar os dados, recriar o tipo e prender as colunas de volta.
-- activity_log.network_key fica em text de vez: o histórico é imutável e precisa
-- continuar guardando eventos das comunidades que deixaram de existir.

--> statement-breakpoint
ALTER TABLE "materia_networks" ALTER COLUMN "network_key" TYPE text;--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "network_key" TYPE text;--> statement-breakpoint
ALTER TABLE "activity_log" ALTER COLUMN "network_key" TYPE text;--> statement-breakpoint

-- comunidade 1 vira o YouTube único
UPDATE "materia_networks" SET "network_key" = 'youtube' WHERE "network_key" = 'youtube_comunidade_1';--> statement-breakpoint
UPDATE "templates" SET "network_key" = 'youtube', "label" = 'YouTube' WHERE "network_key" = 'youtube_comunidade_1';--> statement-breakpoint

-- comunidade 2 deixa de existir como destino (histórico preservado em activity_log)
DELETE FROM "materia_networks" WHERE "network_key" = 'youtube_comunidade_2';--> statement-breakpoint
DELETE FROM "templates" WHERE "network_key" = 'youtube_comunidade_2';--> statement-breakpoint

-- rótulos novos
UPDATE "templates" SET "label" = 'Twitter' WHERE "network_key" = 'twitter_x';--> statement-breakpoint
UPDATE "templates" SET "label" = 'Canal do Facebook' WHERE "network_key" = 'facebook';--> statement-breakpoint

-- recria o tipo só com os 4 destinos
DROP TYPE "public"."network_key";--> statement-breakpoint
CREATE TYPE "public"."network_key" AS ENUM('twitter_x', 'youtube', 'facebook', 'gettr');--> statement-breakpoint

ALTER TABLE "materia_networks" ALTER COLUMN "network_key" TYPE "public"."network_key" USING "network_key"::"public"."network_key";--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "network_key" TYPE "public"."network_key" USING "network_key"::"public"."network_key";
