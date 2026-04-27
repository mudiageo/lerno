ALTER TABLE "course_materials" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "topics" jsonb;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "key_points" jsonb;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "definitions" jsonb;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "potential_questions" jsonb;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "processing_error" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "source_material_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_source_material_id_course_materials_id_fk" FOREIGN KEY ("source_material_id") REFERENCES "public"."course_materials"("id") ON DELETE set null ON UPDATE no action;