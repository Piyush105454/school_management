import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function check() {
  try {
    const res = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parent_guardian_details';
    `);
    console.log("COLUMNS:", JSON.stringify((res as any).rows));
    process.exit(0);
  } catch(e) {
    console.error("DB error:", e);
    process.exit(1);
  }
}
check();
