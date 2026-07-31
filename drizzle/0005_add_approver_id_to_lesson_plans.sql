-- Add approver_id column to lesson_plans to track who actually approved each plan
ALTER TABLE "lesson_plans" ADD COLUMN IF NOT EXISTS "approver_id" uuid REFERENCES "users"("id");
