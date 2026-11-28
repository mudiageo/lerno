ALTER TABLE "posts" drop column "search_vector";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english'::regconfig, coalesce(content->>'body', ''))) STORED;--> statement-breakpoint
CREATE INDEX "idx_posts_search" ON "posts" USING gin ("search_vector");