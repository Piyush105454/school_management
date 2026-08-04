import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting database migration for holidays table...");
  try {
    // 1. Drop unique constraint holidays_date_unique
    await db.execute(sql`
      ALTER TABLE holidays 
      DROP CONSTRAINT IF EXISTS holidays_date_unique;
    `);
    console.log("Dropped constraint 'holidays_date_unique' if it existed.");

    // 2. Add institute column
    await db.execute(sql`
      ALTER TABLE holidays 
      ADD COLUMN IF NOT EXISTS institute text;
    `);
    console.log("Added 'institute' column if it didn't exist.");

    // 3. Create unique composite index on (date, COALESCE(institute, 'ALL'))
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS holidays_date_institute_idx 
      ON holidays (date, COALESCE(institute, 'ALL'));
    `);
    console.log("Created unique index 'holidays_date_institute_idx'.");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
