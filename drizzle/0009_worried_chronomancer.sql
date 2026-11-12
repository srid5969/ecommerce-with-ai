ALTER TABLE "products" ADD COLUMN "embedding" vector(768);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "embedded_at" timestamp;