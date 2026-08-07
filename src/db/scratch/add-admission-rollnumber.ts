import { db } from "../../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Altering admission_meta table to add roll_number column...");
    await db.execute(sql`ALTER TABLE admission_meta ADD COLUMN IF NOT EXISTS roll_number TEXT`);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main().catch(console.error);
