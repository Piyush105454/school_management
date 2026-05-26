import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Altering role enum...");
  try {
    await db.execute(sql`ALTER TYPE "role" ADD VALUE 'PRINCIPAL'`);
    console.log("✅ Successfully added 'PRINCIPAL' to role enum!");
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      console.log("ℹ️ 'PRINCIPAL' already exists in role enum.");
    } else {
      console.error("❌ Failed to alter role enum:", error);
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
