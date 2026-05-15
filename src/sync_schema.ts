import "dotenv/config";
import { db } from "./db/index";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Syncing lesson_plans schema...");
    
    // 1. Create Enum Type
    await db.execute(sql`
      DO $$ BEGIN
          CREATE TYPE "lesson_plan_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("Enum type lesson_plan_status checked/created.");

    // 2. Add columns to lesson_plans
    await db.execute(sql`
      ALTER TABLE "lesson_plans" 
      ADD COLUMN IF NOT EXISTS "status" "lesson_plan_status" DEFAULT 'DRAFT' NOT NULL;
    `);
    console.log("Column 'status' added.");

    await db.execute(sql`
      ALTER TABLE "lesson_plans" 
      ADD COLUMN IF NOT EXISTS "reviewer_id" uuid REFERENCES "users"("id");
    `);
    console.log("Column 'reviewer_id' added.");

    await db.execute(sql`
      ALTER TABLE "lesson_plans" 
      ADD COLUMN IF NOT EXISTS "reviewer_remark" text;
    `);
    console.log("Column 'reviewer_remark' added.");

    console.log("Schema sync completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Schema sync failed:", error);
    process.exit(1);
  }
}

main();
