ALTER TABLE "inquiries" DROP CONSTRAINT "inquiries_phone_unique";--> statement-breakpoint
ALTER TABLE "admission_meta" ALTER COLUMN "applied_scholarship" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "admission_meta" ALTER COLUMN "applied_scholarship" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admission_meta" ADD COLUMN "document_remarks" text;--> statement-breakpoint
ALTER TABLE "admission_meta" ADD COLUMN "verification_remarks" text;--> statement-breakpoint
ALTER TABLE "entrance_tests" ADD COLUMN "admin_remarks" text;--> statement-breakpoint
ALTER TABLE "home_visits" ADD COLUMN "admin_remarks" text;