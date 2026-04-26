ALTER TABLE "posts" ADD COLUMN "source_material_id" uuid REFERENCES "course_materials"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX "idx_posts_source_material" ON "posts" ("source_material_id");
