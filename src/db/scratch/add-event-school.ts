import { db } from "../../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Altering school_events table to add institute column...");
    await db.execute(sql`ALTER TABLE school_events ADD COLUMN IF NOT EXISTS institute TEXT`);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main().catch(console.error);
