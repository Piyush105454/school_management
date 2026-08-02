import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Running scholarship migration...");

    // Add missing columns to scholarship_records (all with IF NOT EXISTS to be safe)
    await db.execute(sql`
      ALTER TABLE "scholarship_records"
        ADD COLUMN IF NOT EXISTS "school_fee" integer NOT NULL DEFAULT 3000,
        ADD COLUMN IF NOT EXISTS "pending_amount" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "adjustment_amount" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "discount_amount" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "additional_charge_amount" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "adjustment_note" text,
        ADD COLUMN IF NOT EXISTS "locked" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "approved_by" text,
        ADD COLUMN IF NOT EXISTS "approved_at" timestamp,
        ADD COLUMN IF NOT EXISTS "paid_online" integer NOT NULL DEFAULT 0;
    `);

    console.log("scholarship_records migration done.");

    // Also ensure scholarshipAttendance has all needed columns
    await db.execute(sql`
      ALTER TABLE "scholarship_attendance"
        ADD COLUMN IF NOT EXISTS "percentage" double precision NOT NULL DEFAULT 0;
    `);

    // Also ensure scholarship_records has the status enum values set up
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scholarship_status') THEN
          CREATE TYPE scholarship_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'SCHOLARSHIP FULL AWARDED');
        END IF;
      END $$;
    `);

    // Add scholarship_ptm columns if missing
    await db.execute(sql`
      ALTER TABLE "scholarship_ptm"
        ADD COLUMN IF NOT EXISTS "attendee" text,
        ADD COLUMN IF NOT EXISTS "guardian_name" text,
        ADD COLUMN IF NOT EXISTS "guardian_relation" text,
        ADD COLUMN IF NOT EXISTS "parent_images" text,
        ADD COLUMN IF NOT EXISTS "locked" boolean NOT NULL DEFAULT false;
    `);

    // Add scholarship_guardian locked column if missing
    await db.execute(sql`
      ALTER TABLE "scholarship_guardian"
        ADD COLUMN IF NOT EXISTS "locked" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "comments" text;
    `);

    // Add scholarship_criteria_settings admissionId if missing
    await db.execute(sql`
      ALTER TABLE "scholarship_criteria_settings"
        ADD COLUMN IF NOT EXISTS "admission_id" uuid REFERENCES "admission_meta"("id") ON DELETE CASCADE;
    `);

    console.log("All scholarship migrations completed successfully.");
    return NextResponse.json({
      success: true,
      message: "All scholarship migrations applied successfully.",
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
