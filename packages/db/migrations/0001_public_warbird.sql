ALTER TABLE "posts" ALTER COLUMN "search_vector" SET DATA TYPE "undefined"."tsvector";--> statement-breakpoint
ALTER TABLE "posts" drop column "search_vector";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("posts"."content"->>'body', '') || ' ' || array_to_string("posts"."topic_tags", ' '))) STORED;