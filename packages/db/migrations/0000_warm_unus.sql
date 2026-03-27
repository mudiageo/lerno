CREATE TYPE "public"."plan" AS ENUM('free', 'premium', 'institutional');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'oled', 'system');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('exam', 'quiz', 'lab', 'assignment', 'presentation', 'other');--> statement-breakpoint
CREATE TYPE "public"."semester" AS ENUM('first', 'second', 'summer', 'trimester_1', 'trimester_2', 'trimester_3');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('text', 'image', 'video', 'quiz', 'flashcard', 'poll', 'thread', 'short', 'link', 'past_exam_q', 'mock_exam');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('like', 'repost', 'bookmark', 'view', 'quiz_answer', 'flashcard_flip', 'poll_vote', 'follow', 'block', 'report');--> statement-breakpoint
CREATE TYPE "public"."billing_period" AS ENUM('monthly', 'yearly', 'one_time', 'institutional');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('paystack', 'stripe');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'active', 'cancelled', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."community_role" AS ENUM('member', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."stream_provider" AS ENUM('custom_webrtc', 'livekit');--> statement-breakpoint
CREATE TYPE "public"."stream_status" AS ENUM('scheduled', 'live', 'ended');--> statement-breakpoint
CREATE TYPE "public"."dmca_status" AS ENUM('pending', 'actioned', 'counter_filed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('superadmin', 'staff_admin', 'moderator', 'support', 'analyst', 'finance', 'content_editor');--> statement-breakpoint
CREATE TYPE "public"."ticket_category" AS ENUM('billing', 'account', 'content', 'technical', 'abuse', 'feature_request', 'other');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'waiting_user', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(40) NOT NULL,
	"display_name" varchar(80),
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false,
	"avatar_url" text,
	"bio" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"ai_enabled" boolean DEFAULT true,
	"theme" "theme" DEFAULT 'system',
	"dyslexia_font" boolean DEFAULT false,
	"reduced_motion" boolean DEFAULT false,
	"xp" integer DEFAULT 0,
	"streak_days" integer DEFAULT 0,
	"last_active_date" timestamp,
	"referral_code" varchar(16),
	"referred_by" uuid,
	"institution_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "course_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"storage_key" text,
	"url" text,
	"ocr_text" text,
	"processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_at" timestamp NOT NULL,
	"duration_mins" integer,
	"weight_pct" integer,
	"location" text,
	"reminder_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"semester" "semester",
	"year" integer,
	"credit_units" integer,
	"active" boolean DEFAULT true,
	"color" varchar(7),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid,
	"course_id" uuid,
	"parent_id" uuid,
	"repost_of_id" uuid,
	"quote_of_id" uuid,
	"post_type" "post_type" NOT NULL,
	"content" jsonb NOT NULL,
	"topic_tags" text[] DEFAULT '{}',
	"ai_generated" boolean DEFAULT false,
	"is_visible" boolean DEFAULT true,
	"is_flagged" boolean DEFAULT false,
	"is_premium" boolean DEFAULT false,
	"like_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"repost_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"engagement_score" integer DEFAULT 0,
	"search_vector" "tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content->>'body', '') || ' ' || array_to_string(topic_tags, ' '))) STORED",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid,
	"target_user_id" uuid,
	"type" "interaction_type" NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge" text NOT NULL,
	"earned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topic_mastery" (
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"topic" text NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"attempts" integer DEFAULT 0,
	"correct" integer DEFAULT 0,
	"fsrs_due" timestamp,
	"fsrs_stability" real,
	"fsrs_difficulty" real,
	"fsrs_reps" integer DEFAULT 0,
	"fsrs_lapses" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "topic_mastery_user_id_course_id_topic_pk" PRIMARY KEY("user_id","course_id","topic")
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"xp_awarded" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" varchar(100),
	"logo_url" text,
	"brand_color" varchar(7),
	"seat_limit" integer NOT NULL,
	"seats_used" integer DEFAULT 0,
	"subscription_id" uuid,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"provider" "payment_provider" NOT NULL,
	"event_type" text NOT NULL,
	"amount" integer,
	"currency" varchar(3),
	"status" "payment_status",
	"raw_payload" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_sub_id" text NOT NULL,
	"plan" varchar(30) NOT NULL,
	"status" "payment_status" DEFAULT 'pending',
	"billing_period" "billing_period" NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"current_period_end" timestamp,
	"cancel_at_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"avatar_url" text,
	"banner_url" text,
	"is_private" boolean DEFAULT false,
	"course_code" varchar(20),
	"member_count" integer DEFAULT 0,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "communities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "community_role" DEFAULT 'member',
	"joined_at" timestamp DEFAULT now(),
	CONSTRAINT "community_members_community_id_user_id_pk" PRIMARY KEY("community_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"actor_id" uuid,
	"target_id" uuid,
	"body" text,
	"metadata" jsonb,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"platform" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"course_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"status" "stream_status" DEFAULT 'scheduled',
	"provider" "stream_provider" DEFAULT 'custom_webrtc',
	"room_id" text,
	"rtmp_key" text,
	"viewer_count" integer DEFAULT 0,
	"peak_viewers" integer DEFAULT 0,
	"is_audio_only" boolean DEFAULT false,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"ended_at" timestamp,
	"recording_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"results" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "youtube_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "dmca_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"reporter_email" text NOT NULL,
	"status" "dmca_status" DEFAULT 'pending',
	"resolution_note" text,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "staff_role" NOT NULL,
	"department" text,
	"employee_id" text,
	"active" boolean DEFAULT true,
	"permissions" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"assigned_to" uuid,
	"category" "ticket_category" NOT NULL,
	"priority" "ticket_priority" DEFAULT 'normal',
	"status" "ticket_status" DEFAULT 'open',
	"subject" text NOT NULL,
	"first_response_at" timestamp,
	"resolved_at" timestamp,
	"satisfaction_score" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"name" text NOT NULL,
	"scopes" text[] NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_users_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_course_id_user_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."user_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_schedule" ADD CONSTRAINT "course_schedule_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_schedule" ADD CONSTRAINT "course_schedule_course_id_user_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."user_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_course_id_user_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."user_courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_course_id_user_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."user_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_course_id_user_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."user_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dmca_requests" ADD CONSTRAINT "dmca_requests_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_staff_members_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_username_trgm" ON "users" USING gin ("username" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_schedule_user_upcoming" ON "course_schedule" USING btree ("user_id","scheduled_at") WHERE "course_schedule"."scheduled_at" > now();--> statement-breakpoint
CREATE INDEX "idx_posts_course_created" ON "posts" USING btree ("course_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_posts_engagement" ON "posts" USING btree ("engagement_score" DESC,"created_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_posts_author" ON "posts" USING btree ("author_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_posts_visible" ON "posts" USING btree ("is_visible") WHERE "posts"."is_visible" = true;--> statement-breakpoint
CREATE INDEX "idx_posts_type" ON "posts" USING btree ("post_type");--> statement-breakpoint
CREATE INDEX "idx_posts_ai" ON "posts" USING btree ("ai_generated");--> statement-breakpoint
CREATE INDEX "idx_posts_tags" ON "posts" USING gin ("topic_tags");--> statement-breakpoint
CREATE INDEX "idx_posts_search" ON "posts" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "idx_posts_trgm" ON "posts" USING gin (("content"->>'body') gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_post" ON "interactions" USING btree ("post_id","type");--> statement-breakpoint
CREATE INDEX "idx_interactions_user" ON "interactions" USING btree ("user_id","type","created_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_mastery_user_course" ON "topic_mastery" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_mastery_fsrs_due" ON "topic_mastery" USING btree ("fsrs_due") WHERE "topic_mastery"."fsrs_due" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","created_at" DESC) WHERE "notifications"."read" = false;--> statement-breakpoint
CREATE INDEX "idx_yt_cache_key" ON "youtube_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "idx_yt_cache_age" ON "youtube_cache" USING btree ("created_at");