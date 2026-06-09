import { db } from "./db/index";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding return_comment to resource_issuances table...");
    await db.execute(sql`
      ALTER TABLE "resource_issuances" 
      ADD COLUMN IF NOT EXISTS "return_comment" text;
    `);
    console.log("Column 'return_comment' added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Schema sync failed:", error);
    process.exit(1);
  }
}

main();
