import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting internal_id migration for lesson_plans...");

    // Add unique SERIAL column to lesson_plans
    console.log("Adding internal_id SERIAL column...");
    await db.execute(sql`
      ALTER TABLE lesson_plans 
      ADD COLUMN IF NOT EXISTS internal_id SERIAL UNIQUE
    `);

    console.log("✅ Internal ID migration completed successfully!");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
