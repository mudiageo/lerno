ALTER TABLE "course_materials" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "topics" jsonb;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "key_points" jsonb;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "definitions" jsonb;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "potential_questions" jsonb;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN "processing_error" text;
