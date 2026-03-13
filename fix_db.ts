import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function fix() {
  try {
    console.log("Creating test_status enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."test_status" AS ENUM('NOT_SCHEDULED', 'PENDING', 'PASS', 'FAIL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Creating entrance_tests table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "entrance_tests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "admission_id" uuid NOT NULL,
        "test_date" text,
        "test_time" text,
        "location" text,
        "teacher_name" text,
        "contact_number" text,
        "status" "test_status" DEFAULT 'NOT_SCHEDULED' NOT NULL,
        "result_date" timestamp,
        "remarks" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "entrance_tests_admission_id_unique" UNIQUE("admission_id")
      );
    `);

    console.log("Adding foreign key constraint...");
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "entrance_tests" 
        ADD CONSTRAINT "entrance_tests_admission_id_admission_meta_id_fk" 
        FOREIGN KEY ("admission_id") REFERENCES "public"."admission_meta"("id") 
        ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Fix completed successfully.");
  } catch (err) {
    console.error("Error fixing database:", err);
  }
}

fix();
