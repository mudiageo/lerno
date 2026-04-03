DROP INDEX "idx_blocks_blocker";--> statement-breakpoint
DROP INDEX "idx_mutes_muter";--> statement-breakpoint
DROP INDEX "idx_reports_status";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "community_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_posts_community" ON "posts" USING btree ("community_id","created_at" DESC);