import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding date column to school_events table...");
  try {
    await db.execute(sql`
      ALTER TABLE school_events 
      ADD COLUMN IF NOT EXISTS date text NOT NULL DEFAULT '2026-08-05';
    `);
    console.log("Added 'date' column successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
