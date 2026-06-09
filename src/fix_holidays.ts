import { db } from "./db/index";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding type, start_time, and end_time to holidays table...");
    await db.execute(sql`
      ALTER TABLE "holidays" 
      ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'FULL_DAY',
      ADD COLUMN IF NOT EXISTS "start_time" text,
      ADD COLUMN IF NOT EXISTS "end_time" text;
    `);
    console.log("Columns added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Schema sync failed:", error);
    process.exit(1);
  }
}

main();
