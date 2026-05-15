import { db } from "./db";
import { sql } from "drizzle-orm";

async function applyIndexes() {
  console.log("Applying indexes to attendance tables...");
  
  try {
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "overall_month_year_idx" ON "overall_attendance" ("month", "year");
      CREATE INDEX IF NOT EXISTS "overall_date_idx" ON "overall_attendance" ("date");
      CREATE INDEX IF NOT EXISTS "student_attendance_date_idx" ON "student_attendance" ("student_id", "date");
      CREATE INDEX IF NOT EXISTS "student_attendance_month_year_idx" ON "student_attendance" ("month", "year");
    `);
    console.log("Indexes applied successfully!");
  } catch (error) {
    console.error("Error applying indexes:", error);
  }
}

applyIndexes().catch(console.error);
