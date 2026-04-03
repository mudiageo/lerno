ALTER TABLE "xp_events" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_course_id_user_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."user_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_xpevents_user_course" ON "xp_events" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_xpevents_course" ON "xp_events" USING btree ("course_id");