CREATE TABLE "ai_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"status" text NOT NULL,
	"result_revision" integer,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_generation_jobs_status_check" CHECK ("ai_generation_jobs"."status" in ('running', 'succeeded', 'failed', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "model_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"model_id" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"input_token_limit" integer,
	"output_token_limit" integer,
	"capabilities" jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"encrypted_secret" text,
	"verified_at" timestamp with time zone,
	"validation_attempts" integer DEFAULT 0 NOT NULL,
	"validation_window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "canvas" SET DEFAULT '{"schemaVersion":1,"nodes":{},"rootIds":[],"breakpoints":{"desktop":{"width":1440,"height":"auto"},"tablet":{"width":768,"height":"auto"},"mobile":{"width":390,"height":"auto"}},"customBlocks":{},"designContextRef":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "ai_generation_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "ai_generation_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_cache" ADD CONSTRAINT "model_cache_connection_id_provider_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."provider_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_generation_jobs_user_idempotency_unique" ON "ai_generation_jobs" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_generation_jobs_one_running_per_user_unique" ON "ai_generation_jobs" USING btree ("user_id") WHERE "ai_generation_jobs"."status" = 'running';--> statement-breakpoint
CREATE INDEX "ai_generation_jobs_user_created_at_idx" ON "ai_generation_jobs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_generation_jobs_project_created_at_idx" ON "ai_generation_jobs" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "model_cache_connection_model_unique" ON "model_cache" USING btree ("connection_id","model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_connections_user_provider_unique" ON "provider_connections" USING btree ("user_id","provider");